import request from 'supertest'
import type { Express } from 'express'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import UserService from '../services/userService'
import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import EntryPointService from '../services/entryPointService'
import { FullPageError } from '../types/FullPageError'
import { ErrorMessageType } from '../types/ErrorMessages'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/PrisonApiOffenderSentenceAndOffences'
import UserInputService from '../services/userInputService'
import {
  CalculationSentenceQuestion,
  CalculationSentenceUserInput,
  CalculationUserInputs,
  CalculationUserQuestions,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import config from '../config'

jest.mock('../services/userService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/prisonerService')
jest.mock('../services/entryPointService')
jest.mock('../services/userInputService')

const userService = new UserService(null) as jest.Mocked<UserService>
const calculateReleaseDatesService = new CalculateReleaseDatesService() as jest.Mocked<CalculateReleaseDatesService>
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const entryPointService = new EntryPointService() as jest.Mocked<EntryPointService>
const userInputService = new UserInputService() as jest.Mocked<UserInputService>

let app: Express

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
  } as PrisonApiOffenderSentenceAndOffences,
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
  } as PrisonApiOffenderSentenceAndOffences,
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
  },
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
  ],
} as PrisonApiBookingAndSentenceAdjustments

const stubbedEmptyAdjustments = {
  sentenceAdjustments: [],
  bookingAdjustments: [],
} as PrisonApiBookingAndSentenceAdjustments

const stubbedReturnToCustodyDate = {
  returnToCustodyDate: '2022-04-12',
} as PrisonApiReturnToCustodyDate

beforeEach(() => {
  config.featureToggles.eds = false
  app = appWithAllRoutes({
    userService,
    prisonerService,
    calculateReleaseDatesService,
    entryPointService,
    userInputService,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Check information routes tests', () => {
  it('GET /calculation/:nomsId/check-information should return detail about the prisoner with the EDS card view', () => {
    config.featureToggles.eds = true
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    prisonerService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    prisonerService.getReturnToCustodyDate.mockResolvedValue(stubbedReturnToCustodyDate)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedQuestion)
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)
    entryPointService.isDpsEntryPoint.mockResolvedValue(true as never)
    return request(app)
      .get('/calculation/A1234AA/check-information')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('sentence-card')
        expect(res.text).toContain('A1234AA')
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).toContain('This calculation will include 8')
        expect(res.text).toContain('sentences from NOMIS.')
        expect(res.text).toContain('Court case 1')
        expect(res.text).toContain('Committed on 03 February 2021')
        expect(res.text).toContain('Committed from 04 January 2021 to 05 January 2021')
        expect(res.text).toContain('Committed on 06 March 2021')
        expect(res.text).toContain('Offence date not entered')
        expect(res.text).toContain('Committed on 07 January 2021')
        expect(res.text).toContain('SDS Standard Sentence')
        expect(res.text).toContain('Court case 2')
        expect(res.text).toContain('Consecutive to  court case 1 count 1')
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
        expect(res.text).not.toContain('98765')
      })
  })

  it('GET /calculation/:nomsId/check-information should return detail about the prisoner', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    prisonerService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    prisonerService.getReturnToCustodyDate.mockResolvedValue(stubbedReturnToCustodyDate)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedQuestion)
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)
    entryPointService.isDpsEntryPoint.mockResolvedValue(true as never)
    return request(app)
      .get('/calculation/A1234AA/check-information')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('A1234AA')
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).toContain('This calculation will include 8')
        expect(res.text).toContain('sentences from NOMIS.')
        expect(res.text).toContain('Court case 1')
        expect(res.text).toContain('Committed on 03 February 2021')
        expect(res.text).toContain('Committed between 04 January 2021 and 05 January 2021')
        expect(res.text).toContain('Committed on 06 March 2021')
        expect(res.text).toContain('Offence date not entered')
        expect(res.text).toContain('Committed on 07 January 2021')
        expect(res.text).toContain('SDS Standard Sentence')
        expect(res.text).toContain('Court case 2')
        expect(res.text).toContain('consecutive to')
        expect(res.text).toContain('court case 1 count 1')
        expect(res.text).toContain('href="/calculation/A1234AA/select-offences-that-appear-in-list-a"')
        expect(res.text).toContain('Restore additional days awarded (RADA)')
        expect(res.text).toContain('2')
        expect(res.text).toContain('Detailed')
        expect(res.text).toContain('From 01 February 2021 to 02 February 2021')
        expect(res.text).toContain('CASE001')
        expect(res.text).toContain('Court 1')
        expect(res.text).toContain('Returned to custody on')
        expect(res.text).toContain('12 April 2022')
        expect(res.text).toContain('SDS+')
        expect(res.text).not.toContain('98765')
      })
  })

  it('GET /calculation/:nomsId/check-information back button should reutrn to dps start page if no calc questions', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    prisonerService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    prisonerService.getReturnToCustodyDate.mockResolvedValue(stubbedReturnToCustodyDate)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue({ sentenceQuestions: [] })
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(null)
    entryPointService.isDpsEntryPoint.mockReturnValue(true)
    return request(app)
      .get('/calculation/A1234AA/check-information')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('href="/?prisonId=A1234AA"')
      })
  })

  it('GET /calculation/:nomsId/check-information should return detail about the prisoner without adjustments', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    prisonerService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedEmptyAdjustments)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedQuestion)
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)
    entryPointService.isDpsEntryPoint.mockReturnValue(true)
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
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    prisonerService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedQuestion)
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)
    calculateReleaseDatesService.validateBackend.mockReturnValue({
      messages: [{ text: 'An error occurred with the nomis information' }],
      messageType: ErrorMessageType.VALIDATION,
    } as never)
    return request(app)
      .get('/calculation/A1234AA/check-information?hasErrors=true')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('An error occurred with the nomis information')
        expect(res.text).toContain('Update these details in NOMIS and then')
      })
  })

  it('GET /calculation/:nomsId/check-information should not display errors once they have been resolved', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    prisonerService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedQuestion)
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)
    calculateReleaseDatesService.validateBackend.mockReturnValue({ messages: [] } as never)
    return request(app)
      .get('/calculation/A1234AA/check-information?hasErrors=true')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Update these details in NOMIS and then')
      })
  })

  it('POST /calculation/:nomsId/check-information pass', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    prisonerService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
    calculateReleaseDatesService.validateBackend.mockResolvedValue({ messages: [] })
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)
    calculateReleaseDatesService.calculatePreliminaryReleaseDates.mockResolvedValue({
      calculationRequestId: 123,
      dates: {},
      effectiveSentenceLength: {},
      prisonerId: 'A1234AA',
      bookingId: 123,
      calculationStatus: 'PRELIMINARY',
    })
    return request(app)
      .post('/calculation/A1234AA/check-information')
      .expect(302)
      .expect('Location', '/calculation/A1234AA/summary/123')
      .expect(res => {
        expect(res.redirect).toBeTruthy()
        expect(calculateReleaseDatesService.validateBackend).toBeCalledWith(
          expect.anything(),
          stubbedUserInput,
          expect.anything(),
          expect.anything()
        )
        expect(calculateReleaseDatesService.calculatePreliminaryReleaseDates).toBeCalledWith(
          expect.anything(),
          'A1234AA',
          stubbedUserInput,
          expect.anything()
        )
      })
  })

  it('POST /calculation/:nomsId/check-information should redirect if validation fails', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    prisonerService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedAdjustments)
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
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedQuestion)
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)
    prisonerService.getPrisonerDetail.mockImplementation(() => {
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
    prisonerService.getSentencesAndOffences.mockImplementation(() => {
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
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedQuestion)
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(null)
    return request(app)
      .get('/calculation/A1234AA/check-information')
      .expect(302)
      .expect('Location', '/calculation/A1234AA/alternative-release-arrangements')
      .expect(res => {
        expect(userInputService.resetCalculationUserInputForPrisoner).toBeCalledWith(expect.anything(), 'A1234AA')
      })
  })

  it('GET /calculation/:nomsId/check-information will redirect user if they have answered questions no longer applicable', () => {
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue({ sentenceQuestions: [] })
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)
    return request(app)
      .get('/calculation/A1234AA/check-information')
      .expect(302)
      .expect('Location', '/calculation/A1234AA/alternative-release-arrangements')
      .expect(res => {
        expect(userInputService.resetCalculationUserInputForPrisoner).toBeCalledWith(expect.anything(), 'A1234AA')
      })
  })
})
