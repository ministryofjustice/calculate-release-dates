import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { v4 } from 'uuid'
import { ApprovedDatesJourney } from '../../../@types/journeys'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import SessionSetup from '../../testutils/sessionSetup'

let app: Express
let session: Partial<SessionData>

let preExistingJourneysToAddToSession: Array<ApprovedDatesJourney>
const nomsId = 'A1234BC'

jest.mock('../../../services/calculateReleaseDatesService')

const calculateReleaseDatesService = new CalculateReleaseDatesService(null) as jest.Mocked<CalculateReleaseDatesService>

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
  it('should create the journey and redirect to review dates page', async () => {
    // Given

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

  it('should not remove any existing journeys in the session', async () => {
    // Given
    const existingUuid = v4()
    preExistingJourneysToAddToSession = [
      {
        id: existingUuid,
        lastTouched: new Date().toISOString(),
        nomsId,
        preliminaryCalculationRequestId: 99,
      },
    ]

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
      },
      {
        id: 'middle-aged',
        lastTouched: new Date(2024, 1, 1, 12, 30).toISOString(),
        nomsId,
        preliminaryCalculationRequestId: 102,
      },
      {
        id: 'youngest',
        lastTouched: new Date(2024, 1, 1, 14, 30).toISOString(),
        nomsId,
        preliminaryCalculationRequestId: 103,
      },
      {
        id: 'oldest',
        lastTouched: new Date(2024, 1, 1, 10, 30).toISOString(),
        nomsId,
        preliminaryCalculationRequestId: 104,
      },
      {
        id: 'young',
        lastTouched: new Date(2024, 1, 1, 13, 30).toISOString(),
        nomsId,
        preliminaryCalculationRequestId: 105,
      },
    ]

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
