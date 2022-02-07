import nock from 'nock'
import HmppsAuthClient from '../api/hmppsAuthClient'
import config from '../config'
import PrisonerService from './prisonerService'
import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
  PrisonApiUserCaseloads,
} from '../@types/prisonApi/prisonClientTypes'
import { FullPageErrorType } from '../types/FullPageError'

jest.mock('../api/hmppsAuthClient')

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
    years: 3,
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
    years: 2,
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
  years: 10,
  caseSequence: 3,
  lineSequence: 3,
  sentenceSequence: 2,
  consecutiveToSequence: 1,
  sentenceStatus: 'I',
  sentenceTypeDescription: 'SDS Standard Sentence',
  offences: [{ offenceEndDate: '2021-02-03' }],
} as PrisonApiOffenderSentenceAndOffences

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
      sentenceSequence: 1,
      type: 'REMAND',
      numberOfDays: 34,
      fromDate: '2021-02-03',
      toDate: '2021-03-08',
      active: false,
    },
    {
      sentenceSequence: 1,
      type: 'TAGGED_BAIL',
      numberOfDays: 6,
      active: true,
    },
    {
      sentenceSequence: 2,
      type: 'REMAND',
      numberOfDays: 13,
      fromDate: '2021-01-03',
      toDate: '2021-01-15',
      active: true,
    },
    {
      sentenceSequence: 2,
      type: 'TAGGED_BAIL',
      numberOfDays: 7,
      active: true,
    },
    {
      sentenceSequence: 2,
      type: 'UNUSED_REMAND',
      numberOfDays: 3,
      fromDate: '2021-01-16',
      toDate: '2021-01-18',
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
      type: 'UNLAWFULLY_AT_LARGE',
      numberOfDays: 10,
      fromDate: '2021-06-01',
      toDate: '2021-06-10',
      active: true,
    },
    {
      type: 'UNLAWFULLY_AT_LARGE',
      numberOfDays: 10,
      fromDate: '2021-08-01',
      toDate: '2021-08-10',
      active: true,
    },
    {
      type: 'ADDITIONAL_DAYS_AWARDED',
      numberOfDays: 4,
      fromDate: '2021-03-05',
      toDate: '2021-03-08',
      active: true,
    },
    {
      type: 'ADDITIONAL_DAYS_AWARDED',
      numberOfDays: 5,
      fromDate: '2021-07-06',
      toDate: '2021-07-10',
      active: true,
    },
    {
      type: 'RESTORED_ADDITIONAL_DAYS_AWARDED',
      numberOfDays: 3,
      fromDate: '2021-07-08',
      toDate: '2021-07-10',
      active: true,
    },
  ],
} as PrisonApiBookingAndSentenceAdjustments

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

      const result = await prisonerService.getUsersCaseloads('user', token)

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
        const result = await prisonerService.getSentencesAndOffences('user', 123, token)
        expect(result).toStrictEqual(activeSentences)
      })
      it('Test getting sentences and offences with no offences', async () => {
        fakeApi.get(`/api/offender-sentences/booking/123/sentences-and-offences`).reply(200, [])
        try {
          const result = await prisonerService.getSentencesAndOffences('user', 123, token)
          expect(result).toStrictEqual(activeSentences)
        } catch (error) {
          expect(error.errorKey).toBe(FullPageErrorType.NO_SENTENCES)
          expect(error.status).toBe(400)
        }
      })
    })
  })

  describe('getAggregatedBookingAndSentenceAdjustments', () => {
    it('Test aggregated adjustments', async () => {
      fakeApi.get(`/api/adjustments/123/sentence-and-booking`).reply(200, stubbedAdjustments)
      const result = await prisonerService.getAggregatedBookingAndSentenceAdjustments(123, token)
      expect(result).toStrictEqual({
        additionalDaysAwarded: 9,
        remand: 13,
        restoredAdditionalDaysAwarded: 5,
        taggedBail: 13,
        unlawfullyAtLarge: 20,
      })
    })
  })
})
