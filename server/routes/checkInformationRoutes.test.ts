import request from 'supertest'
import type { Express } from 'express'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import UserService from '../services/userService'
import {
  AnalyzedPrisonApiBookingAndSentenceAdjustments,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import EntryPointService from '../services/entryPointService'
import { FullPageError } from '../types/FullPageError'
import { ErrorMessageType } from '../types/ErrorMessages'
import UserInputService from '../services/userInputService'
import {
  AnalyzedSentenceAndOffences,
  CalculationSentenceQuestion,
  CalculationSentenceUserInput,
  CalculationUserInputs,
  CalculationUserQuestions,
  ValidationMessage,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import trimHtml from './testutils/testUtils'
import config from '../config'
import QuestionsService from '../services/questionsService'
import CheckInformationService from '../services/checkInformationService'
import SentenceAndOffenceViewModel from '../models/SentenceAndOffenceViewModel'

jest.mock('../services/userService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/prisonerService')
jest.mock('../services/entryPointService')
jest.mock('../services/userInputService')
jest.mock('../services/checkInformationService')
jest.mock('../services/questionsService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const userService = new UserService(null, prisonerService) as jest.Mocked<UserService>
const calculateReleaseDatesService = new CalculateReleaseDatesService() as jest.Mocked<CalculateReleaseDatesService>
const entryPointService = new EntryPointService() as jest.Mocked<EntryPointService>
const userInputService = new UserInputService() as jest.Mocked<UserInputService>
const questionsService = new QuestionsService(
  calculateReleaseDatesService,
  userInputService,
) as jest.Mocked<QuestionsService>
const checkInformationService = new CheckInformationService(
  calculateReleaseDatesService,
  prisonerService,
  entryPointService,
  userInputService,
) as jest.Mocked<CheckInformationService>

let app: Express

const stubbedEmptyMessages: ValidationMessage[] = []

const stubbedPrisonerData = {
  offenderNo: 'A1234AA',
  firstName: 'Anon',
  lastName: 'Nobody',
  latestLocationId: 'LEI',
  locationDescription: 'Inside - Leeds HMP',
  dateOfBirth: '24/06/2000',
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
} as PrisonApiPrisoner

const stubbedSentencesAndOffences = [
  {
    terms: [
      {
        years: 3,
      },
    ],
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 1,
    lineSequence: 1,
    caseReference: 'CASE001',
    courtDescription: 'Court 1',
    sentenceSequence: 1,
    offences: [
      { offenceEndDate: '2021-02-03' },
      { offenceStartDate: '2021-01-04', offenceEndDate: '2021-01-05' },
      { offenceStartDate: '2021-03-06' },
      {},
      { offenceStartDate: '2021-01-07', offenceEndDate: '2021-01-07' },
    ],
    sentenceAndOffenceAnalysis: 'NEW',
  } as AnalyzedSentenceAndOffences,
  {
    terms: [
      {
        years: 2,
      },
    ],
    caseSequence: 2,
    lineSequence: 2,
    caseReference: 'CASE002',
    courtDescription: 'Court 2',
    sentenceSequence: 2,
    consecutiveToSequence: 1,
    sentenceTypeDescription: 'SDS Standard Sentence',
    offences: [{ offenceEndDate: '2021-02-03' }],
    sentenceAndOffenceAnalysis: 'NEW',
  } as AnalyzedSentenceAndOffences,
  {
    sentenceSequence: 3,
    lineSequence: 3,
    caseSequence: 3,
    courtDescription: 'Preston Crown Court',
    sentenceStatus: 'A',
    sentenceCategory: '2020',
    sentenceCalculationType: '14FTR_ORA',
    sentenceTypeDescription: 'ORA 14 Day Fixed Term Recall',
    sentenceDate: '2021-09-03',
    terms: [
      {
        years: 0,
        months: 2,
        weeks: 0,
        days: 0,
      },
    ],
    offences: [
      {
        offenderChargeId: 1,
        offenceStartDate: '2020-01-01',
        offenceCode: 'RL05016',
        offenceDescription: 'Access / exit by unofficial route - railway bye-law',
      },
      {
        offenderChargeId: 2,
        offenceStartDate: '2020-01-01',
        offenceCode: 'RL05016',
        offenceDescription: 'Access / exit by unofficial route - railway bye-law',
      },
    ],
    sentenceAndOffenceAnalysis: 'NEW',
  } as AnalyzedSentenceAndOffences,
  {
    sentenceSequence: 4,
    lineSequence: 4,
    caseSequence: 4,
    courtDescription: 'Amersham Crown Court',
    sentenceStatus: 'A',
    sentenceCategory: '2020',
    sentenceCalculationType: 'EDSU18',
    sentenceTypeDescription: 'EDS Sec 254 Sentencing Code (U18)',
    sentenceDate: '2022-08-08',
    terms: [
      {
        years: 6,
        months: 0,
        weeks: 0,
        days: 0,
        code: 'IMP',
      },
      {
        years: 9,
        months: 0,
        weeks: 0,
        days: 0,
        code: 'IMP',
      },
      {
        years: 2,
        months: 0,
        weeks: 0,
        days: 0,
        code: 'LIC',
      },
      {
        years: 3,
        months: 0,
        weeks: 0,
        days: 0,
        code: 'LIC',
      },
    ],
    offences: [
      {
        offenderChargeId: 3933291,
        offenceStartDate: '2022-08-07',
        offenceCode: 'TH68013A',
        offenceDescription: 'Attempt theft of motor vehicle',
        indicators: ['D', '50', '51'],
      },
    ],
    sentenceAndOffenceAnalysis: 'NEW',
  } as AnalyzedSentenceAndOffences,
  {
    bookingId: 1203025,
    sentenceSequence: 4,
    lineSequence: 4,
    caseSequence: 4,
    courtDescription: 'Abergavenny Magistrates Court',
    sentenceStatus: 'A',
    sentenceCategory: '2020',
    sentenceCalculationType: 'A/FINE',
    sentenceTypeDescription: 'Imprisonment in Default of Fine',
    sentenceDate: '2022-10-01',
    terms: [{ years: 0, months: 0, weeks: 0, days: 90, code: 'IMP' }],
    offences: [
      {
        offenderChargeId: 3933385,
        offenceStartDate: '2022-01-01',
        offenceCode: 'WC81161',
        offenceDescription: 'Keep / confine bird in small cage / receptacle',
        indicators: ['99'],
      },
    ],
    fineAmount: 3000,
    sentenceAndOffenceAnalysis: 'NEW',
  } as AnalyzedSentenceAndOffences,
  {
    bookingId: 1203780,
    sentenceSequence: 5,
    lineSequence: 5,
    caseSequence: 5,
    courtDescription: 'Aldershot and Farnham County Court',
    sentenceStatus: 'A',
    sentenceCategory: '2003',
    sentenceCalculationType: 'LR_LASPO_DR',
    sentenceTypeDescription: 'LR - EDS LASPO Discretionary Release',
    sentenceDate: '2018-06-15',
    terms: [
      { years: 0, months: 40, weeks: 0, days: 0, code: 'IMP' },
      { years: 0, months: 32, weeks: 0, days: 0, code: 'LIC' },
    ],
    offences: [
      {
        offenderChargeId: 3933639,
        offenceStartDate: '2018-04-01',
        offenceCode: 'FA06003B',
        offenceDescription: 'Aid and abet fraud by abuse of position',
        indicators: [],
      },
    ],
    sentenceAndOffenceAnalysis: 'NEW',
  } as AnalyzedSentenceAndOffences,
]
const stubbedUserInput = {
  sentenceCalculationUserInputs: [
    {
      userInputType: 'ORIGINAL',
      userChoice: true,
      offenceCode: 'RL05016',
      sentenceSequence: 3,
    } as CalculationSentenceUserInput,
    {
      userInputType: 'ORIGINAL',
      userChoice: true,
      offenceCode: 'RL05016',
      sentenceSequence: 3,
    } as CalculationSentenceUserInput,
  ],
} as CalculationUserInputs

const stubbedQuestion = {
  sentenceQuestions: [
    {
      userInputType: 'ORIGINAL',
      sentenceSequence: 3,
    } as CalculationSentenceQuestion,
  ],
} as CalculationUserQuestions

const stubbedAdjustments = {
  sentenceAdjustments: [
    {
      sentenceSequence: 1,
      type: 'UNUSED_REMAND',
      numberOfDays: 2,
      fromDate: '2021-02-01',
      toDate: '2021-02-02',
      active: true,
    },
    {
      sentenceSequence: 8,
      type: 'REMAND',
      numberOfDays: 98765,
      fromDate: '2021-02-01',
      toDate: '2021-02-02',
      active: true,
    },
  ],
  bookingAdjustments: [
    {
      type: 'RESTORED_ADDITIONAL_DAYS_AWARDED',
      numberOfDays: 2,
      fromDate: '2021-03-07',
      toDate: '2021-03-08',
      active: true,
    },
    {
      type: 'RESTORED_ADDITIONAL_DAYS_AWARDED',
      numberOfDays: 987654,
      fromDate: '2021-03-07',
      toDate: '2021-03-08',
      active: false,
    },
  ],
} as AnalyzedPrisonApiBookingAndSentenceAdjustments

const stubbedEmptyAdjustments = {
  sentenceAdjustments: [],
  bookingAdjustments: [],
} as AnalyzedPrisonApiBookingAndSentenceAdjustments

const stubbedReturnToCustodyDate = {
  returnToCustodyDate: '2022-04-12',
} as PrisonApiReturnToCustodyDate

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      userService,
      prisonerService,
      calculateReleaseDatesService,
      entryPointService,
      userInputService,
      questionsService,
      checkInformationService,
    },
  })
  config.featureToggles.approvedDates = true
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Check information routes tests', () => {
  it('GET /calculation/:nomsId/check-information should return detail about the prisoner with the EDS card view', () => {
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue(stubbedEmptyMessages)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedQuestion)
    entryPointService.isDpsEntryPoint.mockResolvedValue(true as never)
    const model = new SentenceAndOffenceViewModel(
      stubbedPrisonerData,
      stubbedUserInput,
      true,
      stubbedSentencesAndOffences,
      stubbedAdjustments,
      false,
      stubbedReturnToCustodyDate,
      null,
    )
    checkInformationService.checkInformation.mockResolvedValue(model)
    return request(app)
      .get('/calculation/A1234AA/check-information')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        trimHtml(res)
        expect(res.text).toContain('sentence-card')
        expect(res.text).toContain('A1234AA')
        expect(res.text).toContain('Anon Nobody')
        expect(res.text).toContain('This calculation will include 11')
        expect(res.text).toContain('sentences from NOMIS.')
        expect(res.text).toContain('Court case 1')
        expect(res.text).toContain('Committed on 03 February 2021')
        expect(res.text).toContain('Committed from 04 January 2021 to 05 January 2021')
        expect(res.text).toContain('Committed on 06 March 2021')
        expect(res.text).toContain('Offence date not entered')
        expect(res.text).toContain('Committed on 07 January 2021')
        expect(res.text).toContain('SDS Standard Sentence')
        expect(res.text).toContain('Court case 2')
        expect(res.text).toContain('Consecutive to court case 1 count 1')
        expect(res.text).toContain('href="/calculation/A1234AA/select-offences-that-appear-in-list-a"')
        expect(res.text).toContain('Restore additional days awarded (RADA)')
        expect(res.text).toContain('2')
        expect(res.text).toContain('Detailed')
        expect(res.text).toContain('From 01 February 2021 to 02 February 2021')
        expect(res.text).toContain('CASE001')
        expect(res.text).toContain('Court 1')
        expect(res.text).toContain('Return to custody')
        expect(res.text).toContain('12 April 2022')
        expect(res.text).toContain('SDS+')
        const custodialMatches = (res.text.match(/Custodial term/g) || []).length
        expect(custodialMatches).toBe(3)
        const LicenceMatches = (res.text.match(/Licence period/g) || []).length
        expect(LicenceMatches).toBe(3)
        expect(res.text).not.toContain('98765')
        expect(res.text).toContain('CJA Code')
        expect(res.text).toContain('2020')
        expect(res.text).toContain('Imprisonment in Default of Fine')
        expect(res.text).toContain('£3,000.00')
        expect(res.text).toContain('LR - EDS LASPO Discretionary Release')
        expect(res.text).not.toContain('987654')
        expect(res.text).toContain('Include an Early removal scheme eligibility date (ERSED) in this calculation')
      })
  })

  it('GET /calculation/:nomsId/check-information back button should reutrn to dps start page if no calc questions', () => {
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue(stubbedEmptyMessages)
    prisonerService.getReturnToCustodyDate.mockResolvedValue(stubbedReturnToCustodyDate)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue({ sentenceQuestions: [] })
    entryPointService.isDpsEntryPoint.mockReturnValue(true)
    const model = new SentenceAndOffenceViewModel(
      stubbedPrisonerData,
      null,
      true,
      stubbedSentencesAndOffences,
      stubbedAdjustments,
      false,
      stubbedReturnToCustodyDate,
      null,
    )
    checkInformationService.checkInformation.mockResolvedValue(model)
    return request(app)
      .get('/calculation/A1234AA/check-information')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('href="/?prisonId=A1234AA"')
      })
  })

  it('GET /calculation/:nomsId/check-information should return detail about the prisoner without adjustments', () => {
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue(stubbedEmptyMessages)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedQuestion)
    entryPointService.isDpsEntryPoint.mockReturnValue(true)
    const model = new SentenceAndOffenceViewModel(
      stubbedPrisonerData,
      stubbedUserInput,
      true,
      stubbedSentencesAndOffences,
      stubbedEmptyAdjustments,
      false,
      stubbedReturnToCustodyDate,
      null,
    )
    checkInformationService.checkInformation.mockResolvedValue(model)
    return request(app)
      .get('/calculation/A1234AA/check-information')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Detailed')
        expect(res.text).toContain('There are no detailed adjustments for Anon')
      })
  })
  it('GET /calculation/:nomsId/check-information should display errors when they exist', () => {
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedQuestion)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue(stubbedEmptyMessages)
    calculateReleaseDatesService.validateBackend.mockReturnValue({
      messages: [{ text: 'An error occurred with the nomis information' }],
      messageType: ErrorMessageType.VALIDATION,
    } as never)
    const model = new SentenceAndOffenceViewModel(
      stubbedPrisonerData,
      stubbedUserInput,
      true,
      stubbedSentencesAndOffences,
      stubbedAdjustments,
      false,
      stubbedReturnToCustodyDate,
      {
        messages: [{ text: 'An error occurred with the nomis information' }],
        messageType: ErrorMessageType.VALIDATION,
      } as never,
    )
    checkInformationService.checkInformation.mockResolvedValue(model)
    return request(app)
      .get('/calculation/A1234AA/check-information?hasErrors=true')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('An error occurred with the nomis information')
        expect(res.text).toContain('Update these details in NOMIS and then')
      })
  })
  it('GET /calculation/:nomsId/check-information UNSUPPORTED_SENTENCE should redirect to the unsupported check information page', () => {
    config.featureToggles.manualEntry = true
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
      } as ValidationMessage,
    ])
    return request(app)
      .get('/calculation/A1234AA/check-information')
      .expect(302)
      .expect('Location', '/calculation/A1234AA/check-information-unsupported')
      .expect(res => {
        expect(res.redirect).toBeTruthy()
      })
  })
  it('GET /calculation/:nomsId/check-information should display unsupported calculation errors when they exist', () => {
    config.featureToggles.manualEntry = true
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([
      {
        type: 'UNSUPPORTED_CALCULATION',
      } as ValidationMessage,
    ])
    return request(app)
      .get('/calculation/A1234AA/check-information')
      .expect(302)
      .expect('Location', '/calculation/A1234AA/check-information-unsupported')
      .expect(res => {
        expect(res.redirect).toBeTruthy()
      })
  })

  it('GET /calculation/:nomsId/check-information should not display errors once they have been resolved', () => {
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([] as never)
    calculateReleaseDatesService.validateBackend.mockReturnValue({ messages: [] } as never)
    const model = new SentenceAndOffenceViewModel(
      stubbedPrisonerData,
      stubbedUserInput,
      true,
      stubbedSentencesAndOffences,
      stubbedAdjustments,
      false,
      stubbedReturnToCustodyDate,
      { messages: [] } as never,
    )
    checkInformationService.checkInformation.mockResolvedValue(model)
    return request(app)
      .get('/calculation/A1234AA/check-information?hasErrors=true')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Update these details in NOMIS and then')
      })
  })

  it('GET /calculation/:nomsId/check-information should display notification if sentence has multiple offences', () => {
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([] as never)
    calculateReleaseDatesService.validateBackend.mockReturnValue({ messages: [] } as never)
    const model = new SentenceAndOffenceViewModel(
      stubbedPrisonerData,
      stubbedUserInput,
      true,
      stubbedSentencesAndOffences,
      stubbedAdjustments,
      false,
      null,
      { messages: [] } as never,
    )
    checkInformationService.checkInformation.mockResolvedValue(model)
    return request(app)
      .get('/calculation/A1234AA/check-information?hasErrors=true')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Court case 1 count 1 has multiple offences against the sentence. Each sentence must have only one offence. This service has automatically applied a new sentence for each offence.',
        )
        expect(res.text).toContain(
          'Court case 3 count 3 has multiple offences against the sentence. Each sentence must have only one offence. This service has automatically applied a new sentence for each offence.',
        )
      })
  })

  it('POST /calculation/:nomsId/check-information pass', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getActiveSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    calculateReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    calculateReleaseDatesService.validateBackend.mockResolvedValue({ messages: [] })
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)
    calculateReleaseDatesService.calculatePreliminaryReleaseDates.mockResolvedValue({
      calculationRequestId: 123,
      dates: {},
      effectiveSentenceLength: {},
      prisonerId: 'A1234AA',
      calculationReference: 'ABC123',
      bookingId: 123,
      calculationStatus: 'PRELIMINARY',
      calculationType: 'CALCULATED',
    })
    calculateReleaseDatesService.getCalculationRequestModel.mockResolvedValue({
      calculationReasonId: 1,
      otherReasonDescription: 'other',
      calculationUserInputs: stubbedUserInput,
    })

    return request(app)
      .post('/calculation/A1234AA/check-information')
      .type('form')
      .send({ ersed: 'true' })
      .expect(302)
      .expect('Location', '/calculation/A1234AA/summary/123')
      .expect(res => {
        expect(res.redirect).toBeTruthy()
        expect(calculateReleaseDatesService.validateBackend).toBeCalledWith(
          expect.anything(),
          { ...stubbedUserInput, calculateErsed: true },
          expect.anything(),
        )
        expect(calculateReleaseDatesService.calculatePreliminaryReleaseDates).toBeCalledWith(
          expect.anything(),
          'A1234AA',
          {
            ...{
              calculationReasonId: 1,
              otherReasonDescription: 'other',
              calculationUserInputs: { ...stubbedUserInput, calculateErsed: true },
            },
          },
          expect.anything(),
        )
      })
  })

  it('POST /calculation/:nomsId/check-information should redirect if validation fails', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getActiveSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    calculateReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)
    calculateReleaseDatesService.validateBackend.mockReturnValue({
      messages: [{ text: 'An error occurred with the nomis information' }],
      messageType: ErrorMessageType.VALIDATION,
    } as never)

    return request(app)
      .post('/calculation/A1234AA/check-information')
      .expect(302)
      .expect(res => {
        expect(res.redirect).toBeTruthy()
      })
  })

  it('GET /calculation/:nomsId/check-information should display error page for case load errors.', () => {
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue(stubbedEmptyMessages)
    prisonerService.getPrisonerDetail.mockImplementation(() => {
      throw FullPageError.notInCaseLoadError()
    })
    checkInformationService.checkInformation.mockImplementation(() => {
      throw FullPageError.notInCaseLoadError()
    })
    return request(app)
      .get('/calculation/A1234AA/check-information')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('There is a problem')
        expect(res.text).toContain('The details for this person cannot be found.')
      })
  })
  it('GET /calculation/:nomsId/check-information should display error page for no sentences.', () => {
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedQuestion)
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([] as never)
    checkInformationService.checkInformation.mockImplementation(() => {
      throw FullPageError.noSentences()
    })
    return request(app)
      .get('/calculation/A1234AA/check-information')
      .expect(400)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('There is a problem')
        expect(res.text).toContain('The calculation must include at least one sentence.')
      })
  })

  it('GET /calculation/:nomsId/check-information will redirect user if they have unanswered questions', () => {
    calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages.mockResolvedValue([] as never)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedQuestion)

    questionsService.checkQuestions.mockResolvedValue(true as never)
    return request(app)
      .get('/calculation/A1234AA/check-information')
      .expect(302)
      .expect('Location', '/calculation/A1234AA/alternative-release-arrangements')
  })
})
