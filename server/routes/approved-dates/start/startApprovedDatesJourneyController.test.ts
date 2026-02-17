import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 } from 'uuid'
import { ApprovedDatesJourney } from '../../../@types/journeys'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import SessionSetup from '../../testutils/sessionSetup'
import {
  ApprovedDatesInputResponse,
  CalculatedReleaseDates,
} from '../../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

let app: Express
let session: Partial<SessionData>

let preExistingJourneysToAddToSession: Array<ApprovedDatesJourney>
const nomsId = 'A1234BC'

jest.mock('../../../services/calculateReleaseDatesService')

const calculateReleaseDatesService = new CalculateReleaseDatesService(
  null,
  null,
) as jest.Mocked<CalculateReleaseDatesService>

beforeEach(() => {
  const sessionSetup = new SessionSetup()
  sessionSetup.sessionDoctor = req => {
    session = req.session
    if (preExistingJourneysToAddToSession) {
      session.approvedDatesJourneys = {}
      preExistingJourneysToAddToSession.forEach((journey: ApprovedDatesJourney) => {
        session.approvedDatesJourneys![journey.id] = journey
      })
    }
  }
  app = appWithAllRoutes({
    services: {
      calculateReleaseDatesService,
    },
    userSupplier: () => user,
    sessionSetup,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /approved-dates/:nomsId/start', () => {
  it('should create the journey and redirect to review dates page if adding approved dates is available', async () => {
    // Given
    const inputs: ApprovedDatesInputResponse = {
      approvedDatesAvailable: true,
      calculatedReleaseDates: {
        calculationRequestId: 946,
      } as unknown as CalculatedReleaseDates,
      previousApprovedDates: [],
    }
    calculateReleaseDatesService.getApprovedDatesInputs.mockResolvedValue(inputs)

    // When
    const response = await request(app).get(`/approved-dates/${nomsId}/start`)

    // Then
    expect(response.status).toEqual(302)
    const journeys = Object.values(session.approvedDatesJourneys!)
    expect(journeys).toHaveLength(1)
    expect(response.headers.location).toStrictEqual(
      `/approved-dates/${nomsId}/review-calculated-dates/${journeys[0].id}`,
    )
  })

  it('should map previously approved dates from inputs as dates to save', async () => {
    // Given
    const inputs: ApprovedDatesInputResponse = {
      approvedDatesAvailable: true,
      calculatedReleaseDates: {
        calculationRequestId: 946,
      } as unknown as CalculatedReleaseDates,
      previousApprovedDates: [
        { dateType: 'ROTL', date: '2029-01-03' },
        { dateType: 'APD', date: '2030-02-20' },
        { dateType: 'HDCAD', date: '2025-06-15' },
      ],
    }
    calculateReleaseDatesService.getApprovedDatesInputs.mockResolvedValue(inputs)

    // When
    const response = await request(app).get(`/approved-dates/${nomsId}/start`)

    // Then
    expect(response.status).toEqual(302)
    const journeys = Object.values(session.approvedDatesJourneys!)
    expect(journeys).toHaveLength(1)
    expect(response.headers.location).toStrictEqual(
      `/approved-dates/${nomsId}/review-calculated-dates/${journeys[0].id}`,
    )
    expect(journeys[0]).toStrictEqual({
      id: expect.anything(),
      preliminaryCalculationRequestId: 946,
      nomsId,
      lastTouched: expect.anything(),
      datesToSave: [
        { type: 'ROTL', date: '2029-01-03' },
        { type: 'APD', date: '2030-02-20' },
        { type: 'HDCAD', date: '2025-06-15' },
      ],
      datesBeingAdded: [],
    })
  })

  it('should redirect to full calculation journey with approved dates reason set for the prisoner if approved dates in unavailable', async () => {
    // Given
    const inputs: ApprovedDatesInputResponse = {
      approvedDatesAvailable: false,
      unavailableReason: 'INPUTS_CHANGED_SINCE_LAST_CALCULATION',
      previousApprovedDates: [],
    }
    calculateReleaseDatesService.getApprovedDatesInputs.mockResolvedValue(inputs)

    // When
    const response = await request(app).get(`/approved-dates/${nomsId}/start`)

    // Then
    expect(response.status).toEqual(302)
    expect(session.approvedDatesJourneys).toBeUndefined()
    expect(response.headers.location).toStrictEqual(`/calculation/${nomsId}/reason?isAddDatesFlow=true`)
  })

  it('should not remove any existing journeys in the session', async () => {
    // Given
    const existingUuid = v4()
    preExistingJourneysToAddToSession = [
      {
        id: existingUuid,
        lastTouched: new Date().toISOString(),
        nomsId,
        preliminaryCalculationRequestId: 99,
        datesToSave: [],
        datesBeingAdded: [],
      },
    ]
    calculateReleaseDatesService.getApprovedDatesInputs.mockResolvedValue({
      approvedDatesAvailable: true,
      calculatedReleaseDates: {
        calculationRequestId: 946,
      } as unknown as CalculatedReleaseDates,
      previousApprovedDates: [],
    })

    // When
    const response = await request(app).get(`/approved-dates/${nomsId}/start`)
    const { location } = response.headers

    // Then
    expect(response.status).toEqual(302)
    expect(location).toContain(`/approved-dates/${nomsId}/review-calculated-dates/`)
    const journeys = Object.values(session.approvedDatesJourneys!)
    expect(journeys).toHaveLength(2)
    const newId = journeys.find(it => it.id !== existingUuid).id
    expect(session.approvedDatesJourneys![newId]!.id).toEqual(newId)
    expect(session.approvedDatesJourneys![newId]!.lastTouched).toBeTruthy()
  })

  it('should remove the oldest if there will be more than 5 journeys', async () => {
    // Given
    preExistingJourneysToAddToSession = [
      {
        id: 'old',
        lastTouched: new Date(2024, 1, 1, 11, 30).toISOString(),
        nomsId,
        preliminaryCalculationRequestId: 101,
        datesToSave: [],
        datesBeingAdded: [],
      },
      {
        id: 'middle-aged',
        lastTouched: new Date(2024, 1, 1, 12, 30).toISOString(),
        nomsId,
        preliminaryCalculationRequestId: 102,
        datesToSave: [],
        datesBeingAdded: [],
      },
      {
        id: 'youngest',
        lastTouched: new Date(2024, 1, 1, 14, 30).toISOString(),
        nomsId,
        preliminaryCalculationRequestId: 103,
        datesToSave: [],
        datesBeingAdded: [],
      },
      {
        id: 'oldest',
        lastTouched: new Date(2024, 1, 1, 10, 30).toISOString(),
        nomsId,
        preliminaryCalculationRequestId: 104,
        datesToSave: [],
        datesBeingAdded: [],
      },
      {
        id: 'young',
        lastTouched: new Date(2024, 1, 1, 13, 30).toISOString(),
        nomsId,
        preliminaryCalculationRequestId: 105,
        datesToSave: [],
        datesBeingAdded: [],
      },
    ]
    calculateReleaseDatesService.getApprovedDatesInputs.mockResolvedValue({
      approvedDatesAvailable: true,
      calculatedReleaseDates: {
        calculationRequestId: 946,
      } as unknown as CalculatedReleaseDates,
      previousApprovedDates: [],
    })

    // When
    const response = await request(app).get(`/approved-dates/${nomsId}/start`)
    const { location } = response.headers

    // Then
    expect(location).toContain(`/approved-dates/${nomsId}/review-calculated-dates/`)
    const journeys = Object.values(session.approvedDatesJourneys!)
    const newId = journeys.find(it => it.id.length > 20).id
    expect(Object.keys(session.approvedDatesJourneys!).sort()).toStrictEqual(
      [newId, 'old', 'middle-aged', 'young', 'youngest'].sort(),
    )
  })
})
