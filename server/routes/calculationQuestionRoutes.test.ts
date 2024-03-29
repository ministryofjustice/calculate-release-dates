import request from 'supertest'
import type { Express } from 'express'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import UserService from '../services/userService'
import {
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import UserInputService from '../services/userInputService'
import {
  AnalyzedSentenceAndOffences,
  CalculationSentenceQuestion,
  CalculationSentenceUserInput,
  CalculationUserInputs,
  CalculationUserQuestions,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import trimHtml from './testutils/testUtils'
import config from '../config'
import { expectMiniProfile } from './testutils/layoutExpectations'
import SessionSetup from './testutils/sessionSetup'

jest.mock('../services/userService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/prisonerService')
jest.mock('../services/userInputService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const userService = new UserService(null, prisonerService) as jest.Mocked<UserService>
const calculateReleaseDatesService = new CalculateReleaseDatesService() as jest.Mocked<CalculateReleaseDatesService>
const userInputService = new UserInputService() as jest.Mocked<UserInputService>

let app: Express

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
const expectedMiniProfile = {
  name: 'Nobody, Anon',
  dob: '24/06/2000',
  prisonNumber: 'A1234AA',
  establishment: 'Foo Prison (HMP)',
  location: 'D-2-003',
  status: 'Serving Life Imprisonment',
}
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
    sentenceAndOffenceAnalysis: 'SAME',
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
    offences: [{ offenceEndDate: '2021-02-03', offenceCode: 'def' }],
    sentenceAndOffenceAnalysis: 'SAME',
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
        offenderChargeId: 999,
        offenceStartDate: '2020-01-01',
        offenceCode: 'RL05016',
        offenceDescription: 'Access / exit by unofficial route - railway bye-law',
      },
    ],
    sentenceAndOffenceAnalysis: 'SAME',
  } as AnalyzedSentenceAndOffences,
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
const stubbedCalculationReasons = [
  { id: 9, isOther: false, displayName: '2 day check' },
  { id: 10, isOther: false, displayName: 'Appeal decision' },
  { id: 11, isOther: true, displayName: 'Other' },
]

beforeEach(() => {
  app = appWithAllRoutes({
    services: { userService, prisonerService, calculateReleaseDatesService, userInputService },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Calculation question routes tests', () => {
  it('GET /calculation/:nomsId/alternative-release-arrangements when reason has not been selected should redirect back to /reason', () => {
    config.featureToggles.calculationReasonToggle = true

    return request(app)
      .get('/calculation/A1234AA/alternative-release-arrangements')
      .expect(302)
      .expect('Location', '/calculation/A1234AA/reason')
  })

  it('GET /calculation/:nomsId/alternative-release-arrangements should return detail the alternative release arrangements', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedUserQuestions)

    config.featureToggles.calculationReasonToggle = true

    const sessionSetUp = new SessionSetup()
    sessionSetUp.sessionDoctor = req => {
      req.session.calculationReasonId = '12345'
    }
    const sessionDoctoredApp = appWithAllRoutes({
      services: { userService, prisonerService, calculateReleaseDatesService, userInputService },
      sessionSetup: sessionSetUp,
    })
    return request(sessionDoctoredApp)
      .get('/calculation/A1234AA/alternative-release-arrangements')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('/?prisonId=A1234AA')
        expect(res.text).toContain('Some sentences could have alternative release arrangements')
        expect(res.text).toContain(
          'Some offences for these sentences could be Schedule 15 offences. You must identify the ones that are, by looking them up on the lists.',
        )
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('GET /calculation/:nomsId/alternative-release-arrangements should redirect to check-information if no questions', () => {
    config.featureToggles.calculationReasonToggle = true

    const sessionSetUp = new SessionSetup()
    sessionSetUp.sessionDoctor = req => {
      req.session.calculationReasonId = '12345'
    }
    const sessionDoctoredApp = appWithAllRoutes({
      services: { userService, prisonerService, calculateReleaseDatesService, userInputService },
      sessionSetup: sessionSetUp,
    })
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue({ sentenceQuestions: [] })

    return request(sessionDoctoredApp)
      .get('/calculation/A1234AA/alternative-release-arrangements')
      .expect(302)
      .expect('Location', '/calculation/A1234AA/check-information')
  })

  it('GET /calculation/:nomsId/select-offences-that-appear-in-list-a should return detail about the sds+ questions', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getActiveAnalyzedSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedUserQuestions)
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)

    return request(app)
      .get('/calculation/A1234AA/select-offences-that-appear-in-list-a')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        trimHtml(res)
        expect(res.text).toContain('href="/calculation/A1234AA/alternative-release-arrangements"')
        expect(res.text).toContain('Select offences that appear in List A')
        expect(res.text).toContain('Court case 3')
        expect(res.text).toContain('2 months')
        expect(res.text).toContain('id="checkbox-999" name="999" value="true" checked')
        expect(res.text).toContain('Continue')
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('GET /calculation/:nomsId/select-offences-that-appear-in-list-b should return detail about the sds+ questions', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getActiveAnalyzedSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
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
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('GET /calculation/:nomsId/select-offences-that-appear-in-list-c should redirect if there are no questions', () => {
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedUserQuestions)

    return request(app)
      .get('/calculation/A1234AA/select-offences-that-appear-in-list-c')
      .expect(302)
      .expect('Location', '/calculation/A1234AA/alternative-release-arrangements')
  })

  it('POST /calculation/:nomsId/select-offences-that-appear-in-list-a should save the user input to session', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getActiveAnalyzedSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
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
    calculateReleaseDatesService.getActiveAnalyzedSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
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

  it('POST /calculation/:nomsId/select-offences-that-appear-in-list-b without selecting any offences but selecting none apply', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getActiveAnalyzedSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedUserQuestions)
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)
    return request(app)
      .post('/calculation/A1234AA/select-offences-that-appear-in-list-b')
      .type('form')
      .send({ none: true, charges: ['777'] })
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
              userChoice: false,
              offenceCode: 'abc',
              sentenceSequence: 1,
            } as CalculationSentenceUserInput,
          ],
        } as CalculationUserInputs)
      })
  })

  it('POST /calculation/:nomsId/select-offences-that-appear-in-list-b without selecting any offences OR none apply', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getActiveAnalyzedSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    calculateReleaseDatesService.getCalculationUserQuestions.mockResolvedValue(stubbedUserQuestions)
    userInputService.getCalculationUserInputForPrisoner.mockReturnValue(stubbedUserInput)
    return request(app)
      .post('/calculation/A1234AA/select-offences-that-appear-in-list-b')
      .type('form')
      .send({ charges: ['777'] })
      .expect(200)
      .expect(res => {
        expect(res.text).toContain(
          `<a href="#unselect-all">You must select at least one offence. If none apply, select &#39;None of the sentences include Schedule 15 offences from list B&#39;.</a>`,
        )
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('GET /schedule-15-list-a should return the list of offences in List A', () => {
    return request(app)
      .get('/schedule-15-list-a')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('List A')
      })
  })

  it('GET /schedule-15-list-b should return the list of offences in List B', () => {
    return request(app)
      .get('/schedule-15-list-b')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('List B')
      })
  })

  it('GET /schedule-15-list-c should return the list of offences in List C', () => {
    return request(app)
      .get('/schedule-15-list-c')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('List C')
      })
  })

  it('GET /schedule-15-list-d should return the list of offences in List D', () => {
    return request(app)
      .get('/schedule-15-list-d')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('List D')
      })
  })

  it('POST /calculation/:nomsId/reason should return to check-information once the calculation reason has been set', () => {
    calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
    config.featureToggles.calculationReasonToggle = true

    return request(app)
      .post('/calculation/A1234AA/reason/')
      .type('form')
      .send({ calculationReasonId: ['7'] })
      .expect(302)
      .expect(res => {
        expect(res.text).toContain('Found. Redirecting to /calculation/A1234AA/check-information')
      })
  })

  it('POST /calculation/:nomsId/reason should return to check-information routes if the other reason is selected and the text box has been filled', () => {
    calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
    config.featureToggles.calculationReasonToggle = true

    return request(app)
      .post('/calculation/A1234AA/reason/')
      .type('form')
      .send({ calculationReasonId: ['11'], otherReasonDescription: 'A reason for calculation' })
      .expect(302)
      .expect(res => {
        expect(res.text).toContain('Found. Redirecting to /calculation/A1234AA/check-information')
      })
  })

  it('POST /calculation/:nomsId/reason should ask for the calculation reason if it has not been set', () => {
    calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    config.featureToggles.calculationReasonToggle = true

    return request(app)
      .post('/calculation/A1234AA/reason/')
      .type('form')
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('You must select a reason for the calculation')
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('POST /calculation/:nomsId/reason should return to the reason page and display the error message if the other reason is selected and no text has been entered', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
    config.featureToggles.calculationReasonToggle = true

    return request(app)
      .post('/calculation/A1234AA/reason/')
      .type('form')
      .send({ calculationReasonId: ['11'], otherReasonDescription: '' })
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('You must enter a reason for the calculation')
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('POST /calculation/:nomsId/reason should return to the reason page and display the error message and the original text if the other reason is selected and more than 120 characters been entered', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
    config.featureToggles.calculationReasonToggle = true

    return request(app)
      .post('/calculation/A1234AA/reason/')
      .type('form')
      .send({
        calculationReasonId: ['11'],
        otherReasonDescription:
          'A string which is at least 120 characters requires quite a bit of padding to get it to the correct length so it can be tested',
      })
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Reason must be 120 characters or less')
        expect(res.text).toContain(
          'A string which is at least 120 characters requires quite a bit of padding to get it to the correct length so it can be tested',
        )
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })

  it('GET /calculation/:nomsId/reason should include the mini profile', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
    config.featureToggles.calculationReasonToggle = true

    return request(app)
      .get('/calculation/A1234AA/reason/')
      .expect(200)
      .expect(res => {
        expectMiniProfile(res.text, expectedMiniProfile)
      })
  })
  it('GET /calculation/:nomsId/reason back should take you to CCARD landing page', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getCalculationReasons.mockResolvedValue(stubbedCalculationReasons)
    config.featureToggles.calculationReasonToggle = true

    return request(app)
      .get('/calculation/A1234AA/reason/')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.govuk-back-link').first().attr('href')).toStrictEqual('/?prisonId=A1234AA')
      })
  })
})
