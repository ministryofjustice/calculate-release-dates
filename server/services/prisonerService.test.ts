import nock from 'nock'
import HmppsAuthClient from '../data/hmppsAuthClient'
import config from '../config'
import PrisonerService from './prisonerService'
import {
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
  PrisonApiUserCaseloads,
} from '../@types/prisonApi/prisonClientTypes'
import { FullPageErrorType } from '../types/FullPageError'

jest.mock('../data/hmppsAuthClient')

const caseload = {
  caseLoadId: 'MDI',
} as PrisonApiUserCaseloads

const prisonerDetails = {
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
  agencyId: 'MDI',
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

const activeSentences = [
  {
    terms: [
      {
        years: 3,
      },
    ],
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 1,
    lineSequence: 1,
    sentenceSequence: 1,
    sentenceStatus: 'A',
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
    sentenceSequence: 2,
    consecutiveToSequence: 1,
    sentenceStatus: 'A',
    sentenceTypeDescription: 'SDS Standard Sentence',
    offences: [{ offenceEndDate: '2021-02-03' }],
  } as PrisonApiOffenderSentenceAndOffences,
]
const inactiveSentence = {
  terms: [
    {
      years: 10,
    },
  ],
  caseSequence: 3,
  lineSequence: 3,
  sentenceSequence: 2,
  consecutiveToSequence: 1,
  sentenceStatus: 'I',
  sentenceTypeDescription: 'SDS Standard Sentence',
  offences: [{ offenceEndDate: '2021-02-03' }],
} as PrisonApiOffenderSentenceAndOffences

const token = 'token'

describe('Prisoner service related tests', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let prisonerService: PrisonerService
  let fakeApi: nock.Scope
  beforeEach(() => {
    config.apis.prisonApi.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.prisonApi.url)
    hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
    prisonerService = new PrisonerService(hmppsAuthClient)
  })
  afterEach(() => {
    nock.cleanAll()
  })

  describe('prisonerService', () => {
    it('Test fetching user caseloads', async () => {
      fakeApi.get(`/api/users/me/caseLoads`).reply(200, [caseload])

      const result = await prisonerService.getUsersCaseloads(token)

      expect(result).toEqual([caseload])
    })
    describe('getPrisonerDetail', () => {
      it('Test getting prisoner details', async () => {
        fakeApi.get(`/api/offenders/A1234AB`).reply(200, prisonerDetails)

        const result = await prisonerService.getPrisonerDetail('user', 'A1234AB', ['MDI'], token)

        expect(result).toEqual(prisonerDetails)
      })

      it('Test getting prisoner details when caseload is different', async () => {
        fakeApi.get(`/api/offenders/A1234AB`).reply(200, { ...prisonerDetails, agencyId: 'LEX' })

        try {
          await prisonerService.getPrisonerDetail('user', 'A1234AB', ['MDI'], token)
        } catch (error) {
          expect(error.errorKey).toBe(FullPageErrorType.NOT_IN_CASELOAD)
          expect(error.status).toBe(404)
        }
      })
    })

    describe('getSentencesAndOffences', () => {
      it('Test getting sentences and offences details', async () => {
        fakeApi
          .get(`/api/offender-sentences/booking/123/sentences-and-offences`)
          .reply(200, [...activeSentences, inactiveSentence])
        const result = await prisonerService.getActiveSentencesAndOffences('user', 123, token)
        expect(result).toStrictEqual(activeSentences)
      })
      it('Test getting sentences and offences with no offences', async () => {
        fakeApi.get(`/api/offender-sentences/booking/123/sentences-and-offences`).reply(200, [])
        try {
          const result = await prisonerService.getActiveSentencesAndOffences('user', 123, token)
          expect(result).toStrictEqual(activeSentences)
        } catch (error) {
          expect(error.errorKey).toBe(FullPageErrorType.NO_SENTENCES)
          expect(error.status).toBe(400)
        }
      })
    })
  })
})
