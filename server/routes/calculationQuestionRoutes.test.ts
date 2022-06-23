import request from 'supertest'
import type { Express } from 'express'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import UserService from '../services/userService'
import { PrisonApiPrisoner, PrisonApiSentenceDetail } from '../@types/prisonApi/prisonClientTypes'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import EntryPointService from '../services/entryPointService'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/PrisonApiOffenderSentenceAndOffences'
import UserInputService from '../services/userInputService'
import {
  CalculationSentenceQuestion,
  CalculationSentenceUserInput,
  CalculationUserInputs,
  CalculationUserQuestions,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

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
      {
        offenderChargeId: 777,
        offenceEndDate: '2021-02-03',
        offenceCode: 'abc',
      },
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
    offences: [{ offenceEndDate: '2021-02-03', offenceCode: 'def' }],
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
        offenderChargeId: 999,
        offenceStartDate: '2020-01-01',
        offenceCode: 'RL05016',
        offenceDescription: 'Access / exit by unofficial route - railway bye-law',
      },
    ],
  },
]
const stubbedUserQuestions = {
  sentenceQuestions: [
    {
      sentenceSequence: 1,
      userInputType: 'FOUR_TO_UNDER_SEVEN',
    } as CalculationSentenceQuestion,
    {
      sentenceSequence: 3,
      userInputType: 'ORIGINAL',
    } as CalculationSentenceQuestion,
  ],
} as CalculationUserQuestions
const stubbedUserInput = {
  sentenceCalculationUserInputs: [
    {
      userInputType: 'ORIGINAL',
      userChoice: true,
      offenceCode: 'RL05016',
      sentenceSequence: 3,
    } as CalculationSentenceUserInput,
    {
      userInputType: 'FOUR_TO_UNDER_SEVEN',
      userChoice: false,
      offenceCode: 'abc',
      sentenceSequence: 1,
    } as CalculationSentenceUserInput,
  ],
} as CalculationUserInputs

beforeEach(() => {
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

describe('Calculation question routes tests', () => {
  it('GET /calculation/:nomsId/alternative-release-arrangements should return detail the alternative release arrangements', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedUserQuestions)
    entryPointService.isDpsEntryPoint.mockReturnValue(true)

    return request(app)
      .get('/calculation/A1234AA/alternative-release-arrangements')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('/?prisonId=A1234AA')
        expect(res.text).toContain('Some sentences could have alternative release arrangements')
        expect(res.text).toContain('List A')
        expect(res.text).toContain('List B')
        expect(res.text).not.toContain('List C')
        expect(res.text).not.toContain('List D')
        expect(res.text).toContain('On the following pages, you must select the offences with SDS+ release')
      })
  })

  it('GET /calculation/:nomsId/alternative-release-arrangements should redirect if no questions', () => {
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue({ sentenceQuestions: [] })
    return request(app)
      .get('/calculation/A1234AA/alternative-release-arrangements')
      .expect(302)
      .expect('Location', '/calculation/A1234AA/check-information')
  })

  it('GET /calculation/:nomsId/select-offences-that-appear-in-list-a should return detail about the sds+ questions', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedUserQuestions)
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)

    return request(app)
      .get('/calculation/A1234AA/select-offences-that-appear-in-list-a')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('href="/calculation/A1234AA/alternative-release-arrangements"')
        expect(res.text).toContain('Select offences that appear in List A')
        expect(res.text).toContain('Court case 3')
        expect(res.text).toContain('id="checkbox-999" name="999" value="true" checked')
        expect(res.text).toContain('Continue')
      })
  })

  it('GET /calculation/:nomsId/select-offences-that-appear-in-list-b should return detail about the sds+ questions', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedUserQuestions)
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)

    return request(app)
      .get('/calculation/A1234AA/select-offences-that-appear-in-list-b')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('href="/calculation/A1234AA/select-offences-that-appear-in-list-a"')
        expect(res.text).toContain('Select offences that appear in List B')
        expect(res.text).toContain('Court case 1')
        expect(res.text).toContain('id="checkbox-777" name="777" value="true"')
        expect(res.text).toContain('Continue')
      })
  })

  it('GET /calculation/:nomsId/select-offences-that-appear-in-list-c should redirect if there are no questions', () => {
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedUserQuestions)

    return request(app)
      .get('/calculation/A1234AA/select-offences-that-appear-in-list-c')
      .expect(302)
      .expect('Location', '/calculation/A1234AA/alternative-release-arangements')
  })

  it('POST /calculation/:nomsId/select-offences-that-appear-in-list-a should save the user input to session', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedUserQuestions)
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)
    return request(app)
      .post('/calculation/A1234AA/select-offences-that-appear-in-list-a')
      .type('form')
      .send({ '999': true, charges: ['999'] })
      .expect(302)
      .expect('Location', '/calculation/A1234AA/select-offences-that-appear-in-list-b')
      .expect(res => {
        expect(userInputService.setCalculationUserInputForPrisoner).toBeCalledWith(expect.anything(), 'A1234AA', {
          sentenceCalculationUserInputs: [
            {
              userInputType: 'FOUR_TO_UNDER_SEVEN',
              userChoice: false,
              offenceCode: 'abc',
              sentenceSequence: 1,
            } as CalculationSentenceUserInput,
            {
              userInputType: 'ORIGINAL',
              userChoice: true,
              offenceCode: 'RL05016',
              sentenceSequence: 3,
            } as CalculationSentenceUserInput,
          ],
        } as CalculationUserInputs)
      })
  })

  it('POST /calculation/:nomsId/select-offences-that-appear-in-list-b should save the user input to session', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedUserQuestions)
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)
    return request(app)
      .post('/calculation/A1234AA/select-offences-that-appear-in-list-b')
      .type('form')
      .send({ '777': true, charges: ['777'] })
      .expect(302)
      .expect('Location', '/calculation/A1234AA/check-information')
      .expect(res => {
        expect(userInputService.setCalculationUserInputForPrisoner).toBeCalledWith(expect.anything(), 'A1234AA', {
          sentenceCalculationUserInputs: [
            {
              userInputType: 'ORIGINAL',
              userChoice: true,
              offenceCode: 'RL05016',
              sentenceSequence: 3,
            } as CalculationSentenceUserInput,
            {
              userInputType: 'FOUR_TO_UNDER_SEVEN',
              userChoice: true,
              offenceCode: 'abc',
              sentenceSequence: 1,
            } as CalculationSentenceUserInput,
          ],
        } as CalculationUserInputs)
      })
  })
})
