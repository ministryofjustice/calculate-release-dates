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
import config from '../../config'
import CheckInformationService from '../../services/checkInformationService'
import UserInputService from '../../services/userInputService'

jest.mock('../../services/calculateReleaseDatesService')
jest.mock('../../services/prisonerService')
jest.mock('../../services/checkInformationService')
jest.mock('../../services/userInputService')

describe('MultipleConsecutiveToInterceptController', () => {
  let app: Express
  const sessionSetup = new SessionSetup()

  const calculateReleaseDatesService = new CalculateReleaseDatesService(
    null,
  ) as jest.Mocked<CalculateReleaseDatesService>
  const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>
  const checkInformationService = new CheckInformationService(null, null) as jest.Mocked<CheckInformationService>
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

  beforeEach(() => {
    config.featureToggles.showBreakdown = true

    app = appWithAllRoutes({
      services: {
        calculateReleaseDatesService,
        prisonerService,
        checkInformationService,
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
    it('GET /calculation/:nomsId/concurrent-consecutive should display a warning including the period', () => {
      sessionSetup.sessionDoctor = req => {
        req.session.calculationReasonId = 1
      }

      return request(app)
        .get('/calculation/A1234AA/concurrent-consecutive?duration=7%20years%200%20months%200%20weeks%200%20days')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.moj-interruption-card__heading').first().text().trim()).toStrictEqual(
            'Multiple sentences have been made consecutive to one sentence',
          )
          expect($('.moj-interruption-card__body').eq(0).find('p').eq(0).text().trim()).toStrictEqual(
            'The length of the aggregate is currently 7 years 0 months 0 weeks 0 days.',
          )
        })
    })

    it('GET /calculation/:nomsId/concurrent-consecutive should redirect back to check information if no reason set', () => {
      sessionSetup.sessionDoctor = req => {
        req.session.calculationReasonId = undefined
      }

      return request(app)
        .get('/calculation/A1234AA/concurrent-consecutive?duration=7%20years%200%20months%200%20weeks%200%20days')
        .expect(302)
        .expect('Location', '/calculation/A1234AA/check-information')
    })

    it('GET /calculation/:nomsId/concurrent-consecutive should redirect back to check information if no duration set', () => {
      sessionSetup.sessionDoctor = req => {
        req.session.calculationReasonId = 1
      }

      return request(app)
        .get('/calculation/A1234AA/concurrent-consecutive')
        .expect(302)
        .expect('Location', '/calculation/A1234AA/check-information')
    })
  })

  describe('POST', () => {
    it('POST /calculation/:nomsId/concurrent-consecutive should submit a new calculation with previous SLED requested in case the sentences have been updated', () => {
      const userInputsFromSession = {
        sentenceCalculationUserInputs: [],
        calculateErsed: true,
        usePreviouslyRecordedSLEDIfFound: false,
        useOffenceIndicators: false,
      }
      const expectedInputs = {
        sentenceCalculationUserInputs: [],
        calculateErsed: true,
        usePreviouslyRecordedSLEDIfFound: true,
        useOffenceIndicators: false,
      }

      userInputService.getCalculationUserInputForPrisoner.mockReturnValue(userInputsFromSession)
      calculateReleaseDatesService.calculatePreliminaryReleaseDates.mockResolvedValue({
        calculationRequestId: 123,
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
        .post('/calculation/A1234AA/concurrent-consecutive')
        .type('form')
        .send({ sentenceDuration: '7 years 0 months 0 weeks 0 days' })
        .expect(302)
        .expect(
          'Location',
          'summary/123?callbackUrl=/calculation/A1234AA/concurrent-consecutive?duration=7%20years%200%20months%200%20weeks%200%20days',
        )
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
        })
    })

    it('POST /calculation/:nomsId/concurrent-consecutive should redirect to previously recorded SLED intercept if one was used in the new calc', () => {
      const userInputsFromSession = {
        sentenceCalculationUserInputs: [],
        calculateErsed: true,
        usePreviouslyRecordedSLEDIfFound: false,
        useOffenceIndicators: false,
      }
      const expectedInputs = {
        sentenceCalculationUserInputs: [],
        calculateErsed: true,
        usePreviouslyRecordedSLEDIfFound: true,
        useOffenceIndicators: false,
      }

      userInputService.getCalculationUserInputForPrisoner.mockReturnValue(userInputsFromSession)
      calculateReleaseDatesService.calculatePreliminaryReleaseDates.mockResolvedValue({
        calculationRequestId: 123,
        dates: {},
        effectiveSentenceLength: null,
        prisonerId: 'A1234AA',
        calculationReference: 'ABC123',
        bookingId: 123,
        calculationStatus: 'PRELIMINARY',
        calculationType: 'CALCULATED',
        usedPreviouslyRecordedSLED: {
          previouslyRecordedSLEDCalculationRequestId: 999,
          previouslyRecordedSLEDDate: '2025-03-16',
          calculatedDate: '2025-02-15',
        },
      })
      calculateReleaseDatesService.getCalculationRequestModel.mockReturnValue({
        calculationReasonId: 1,
        otherReasonDescription: 'other',
        calculationUserInputs: expectedInputs,
      })
      return request(app)
        .post('/calculation/A1234AA/concurrent-consecutive')
        .type('form')
        .send({ sentenceDuration: '7 years 0 months 0 weeks 0 days' })
        .expect(302)
        .expect('Location', `/calculation/A1234AA/previously-recorded-sled-intercept/123`)
    })
  })
})
