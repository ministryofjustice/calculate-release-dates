import { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import { appWithAllRoutes } from '../testutils/appSetup'
import SessionSetup from '../testutils/sessionSetup'
import PrisonerService from '../../services/prisonerService'
import {
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../../@types/prisonApi/prisonClientTypes'
import { BookingCalculation } from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import config from '../../config'
import UserInputService from '../../services/userInputService'
import { ResultsWithBreakdownAndAdjustments } from '../../@types/calculateReleaseDates/rulesWithExtraAdjustments'

jest.mock('../../services/calculateReleaseDatesService')
jest.mock('../../services/prisonerService')
jest.mock('../../services/userInputService')

let siblingCalculationWithPreviouslyRecordedSLED

describe('PreviouslyRecordedSledInterceptController', () => {
  let app: Express
  const sessionSetup = new SessionSetup()
  sessionSetup.sessionDoctor = req => {
    req.session.siblingCalculationWithPreviouslyRecordedSLED = siblingCalculationWithPreviouslyRecordedSLED
  }
  const calculateReleaseDatesService = new CalculateReleaseDatesService(
    null,
  ) as jest.Mocked<CalculateReleaseDatesService>
  const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>
  const userInputService = new UserInputService() as jest.Mocked<UserInputService>

  const stubbedPrisonerData = {
    offenderNo: 'A1234AA',
    firstName: 'Anon',
    lastName: 'Nobody',
    latestLocationId: 'LEI',
    locationDescription: 'Inside - Leeds HMP',
    dateOfBirth: '2000-06-24',
    age: 21,
    activeFlag: true,
    legalStatus: 'REMAND',
    category: 'Cat C',
    imprisonmentStatus: 'LIFE',
    imprisonmentStatusDescription: 'Serving Life Imprisonment',
    religion: 'Christian',
    agencyId: 'LEI',
    sentenceDetail: {
      sentenceStartDate: '12/12/2019',
      additionalDaysAwarded: 4,
      tariffDate: '12/12/2030',
      releaseDate: '12/12/2028',
      conditionalReleaseDate: '12/12/2025',
      confirmedReleaseDate: '12/12/2026',
      sentenceExpiryDate: '16/12/2030',
      licenceExpiryDate: '16/12/2030',
    } as PrisonApiSentenceDetail,
    assignedLivingUnit: {
      agencyName: 'Foo Prison (HMP)',
      description: 'D-2-003',
    } as PrisonAPIAssignedLivingUnit,
  } as PrisonApiPrisoner
  const stubbedCalculationResults = {
    dates: {
      CRD: '2021-02-03',
      SED: '2021-02-03',
      HDCED: '2021-10-03',
      ERSED: '2020-02-03',
    },
    calculationRequestId: 123456,
    effectiveSentenceLength: null,
    prisonerId: stubbedPrisonerData.offenderNo,
    calculationStatus: 'CONFIRMED',
    calculationReference: 'ABC123',
    calculationType: 'CALCULATED',
    bookingId: 123,
    approvedDates: {},
  } as BookingCalculation

  const stubbedResultsWithBreakdownAndAdjustments: ResultsWithBreakdownAndAdjustments = {
    context: {
      calculationRequestId: stubbedCalculationResults.calculationRequestId,
      prisonerId: stubbedCalculationResults.prisonerId,
      bookingId: stubbedCalculationResults.bookingId,
      calculationDate: stubbedCalculationResults.calculationDate,
      calculationStatus: stubbedCalculationResults.calculationStatus,
      calculationReference: stubbedCalculationResults.calculationReference,
      calculationType: stubbedCalculationResults.calculationType,
      calculationReason: stubbedCalculationResults.calculationReason,
      otherReasonDescription: stubbedCalculationResults.otherReasonDescription,
      usePreviouslyRecordedSLEDIfFound: true,
      calculatedByUsername: 'user1',
      calculatedByDisplayName: 'User One',
    },
    dates: {
      CRD: {
        date: '2021-02-03',
        type: 'CRD',
        description: 'Conditional release date',
        hints: [{ text: 'Tuesday, 02 February 2021 when adjusted to a working day' }],
      },
      SED: { date: '2021-02-03', type: 'SED', description: 'Sentence expiry date', hints: [] },
      HDCED: {
        date: '2021-10-03',
        type: 'HDCED',
        description: 'Home detention curfew eligibility date',
        hints: [{ text: 'Tuesday, 05 October 2021 when adjusted to a working day' }],
      },
      ERSED: { date: '2020-02-03', type: 'ERSED', description: 'Early removal scheme eligibility date', hints: [] },
    },
    calculationBreakdown: null,
    releaseDatesWithAdjustments: null,
    calculationOriginalData: null,
    approvedDates: {},
    tranche: 'TRANCHE_1',
  }

  beforeEach(() => {
    config.featureToggles.showBreakdown = true
    siblingCalculationWithPreviouslyRecordedSLED = {}
    app = appWithAllRoutes({
      services: {
        calculateReleaseDatesService,
        prisonerService,
        userInputService,
      },
      sessionSetup,
    })
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
  })

  afterEach(() => {
    jest.resetAllMocks()
    config.featureToggles.showBreakdown = true
  })

  describe('GET', () => {
    it('GET /calculation/:nomsId/previously-recorded-sled-intercept/:calculationRequestId should go straight to calc summary if no previously used SLED', () => {
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue(
        stubbedResultsWithBreakdownAndAdjustments,
      )

      return request(app)
        .get(`/calculation/${stubbedPrisonerData.offenderNo}/previously-recorded-sled-intercept/123`)
        .expect(302)
        .expect('Location', `/calculation/${stubbedPrisonerData.offenderNo}/summary/123`)
    })

    it('GET /calculation/:nomsId/previously-recorded-sled-intercept/:calculationRequestId should display a warning about the previously recorded SLED', () => {
      calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments.mockResolvedValue({
        ...stubbedResultsWithBreakdownAndAdjustments,
        usedPreviouslyRecordedSLED: {
          previouslyRecordedSLEDCalculationRequestId: 999,
          previouslyRecordedSLEDDate: '2025-03-16',
          calculatedDate: '2025-02-15',
        },
      })

      return request(app)
        .get(`/calculation/${stubbedPrisonerData.offenderNo}/previously-recorded-sled-intercept/123`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-qa=main-heading]').text().trim()).toStrictEqual(
            'This calculation may include a SLED from a previous period of custody',
          )
          expect($('[data-qa=previous-sled-details]').text().trim()).toStrictEqual(
            'This service has found a SLED (Sentence and licence expiry date) on 16 March 2025 from another period of custody that can be used for this calculation.',
          )
          expect($('[data-qa=calculated-sled-details]').text().trim()).toStrictEqual(
            'The calculated SLED is currently 15 February 2025.',
          )
        })
    })
  })

  describe('POST', () => {
    it('POST /calculation/:nomsId/previously-recorded-sled-intercept/:calculationRequestId without a selected option should return to input', () => {
      return request(app)
        .post(`/calculation/${stubbedPrisonerData.offenderNo}/previously-recorded-sled-intercept/123`)
        .type('form')
        .send({})
        .expect(302)
        .expect('Location', `/calculation/${stubbedPrisonerData.offenderNo}/previously-recorded-sled-intercept/123#`)
    })

    it('POST /calculation/:nomsId/previously-recorded-sled-intercept/:calculationRequestId selecting NO should generate a new preliminary calc with no previous SLED and redirect to its calc summary', () => {
      const userInputsFromSession = {
        sentenceCalculationUserInputs: [],
        calculateErsed: true,
        usePreviouslyRecordedSLEDIfFound: true,
        useOffenceIndicators: false,
      }
      const expectedInputs = {
        sentenceCalculationUserInputs: [],
        calculateErsed: true,
        usePreviouslyRecordedSLEDIfFound: false,
        useOffenceIndicators: false,
      }

      userInputService.getCalculationUserInputForPrisoner.mockReturnValue(userInputsFromSession)
      calculateReleaseDatesService.calculatePreliminaryReleaseDates.mockResolvedValue({
        calculationRequestId: 321,
        dates: {},
        effectiveSentenceLength: null,
        prisonerId: 'A1234AA',
        calculationReference: 'ABC123',
        bookingId: 123,
        calculationStatus: 'PRELIMINARY',
        calculationType: 'CALCULATED',
      })
      calculateReleaseDatesService.getCalculationRequestModel.mockReturnValue({
        calculationReasonId: 1,
        otherReasonDescription: 'other',
        calculationUserInputs: expectedInputs,
      })

      return request(app)
        .post(`/calculation/${stubbedPrisonerData.offenderNo}/previously-recorded-sled-intercept/123`)
        .type('form')
        .send({ usePreviouslyRecordedSLED: 'NO' })
        .expect(302)
        .expect('Location', `/calculation/${stubbedPrisonerData.offenderNo}/summary/321`)
        .expect(_ => {
          expect(calculateReleaseDatesService.getCalculationRequestModel).toHaveBeenCalledWith(
            expect.anything(),
            expectedInputs,
            expect.anything(),
          )
          expect(calculateReleaseDatesService.calculatePreliminaryReleaseDates).toHaveBeenCalledWith(
            'A1234AA',
            {
              ...{
                calculationReasonId: 1,
                otherReasonDescription: 'other',
                calculationUserInputs: expectedInputs,
              },
            },
            expect.anything(),
          )
          expect(siblingCalculationWithPreviouslyRecordedSLED[321]).toStrictEqual(123)
        })
    })

    it('POST /calculation/:nomsId/previously-recorded-sled-intercept/:calculationRequestId selecting YES redirect to the calc summary', () => {
      return request(app)
        .post(`/calculation/${stubbedPrisonerData.offenderNo}/previously-recorded-sled-intercept/123`)
        .type('form')
        .send({ usePreviouslyRecordedSLED: 'YES' })
        .expect(302)
        .expect('Location', `/calculation/${stubbedPrisonerData.offenderNo}/summary/123`)
        .expect(_ => {
          expect(calculateReleaseDatesService.getCalculationRequestModel).not.toHaveBeenCalled()
          expect(calculateReleaseDatesService.calculatePreliminaryReleaseDates).not.toHaveBeenCalled()
          expect(siblingCalculationWithPreviouslyRecordedSLED).toStrictEqual({})
        })
    })
  })
})
