import {
  AnalysedSentenceAndOffence,
  CalculationUserInputs,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import SentenceAndOffenceViewModel from './SentenceAndOffenceViewModel'
import {
  AnalysedPrisonApiBookingAndSentenceAdjustments,
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'

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

const stubbedEmptyAdjustments = {
  sentenceAdjustments: [],
  bookingAdjustments: [],
} as AnalysedPrisonApiBookingAndSentenceAdjustments

const stubbedReturnToCustodyDate = {
  returnToCustodyDate: '2022-04-12',
} as PrisonApiReturnToCustodyDate
const stubbedUserInput = {
  sentenceCalculationUserInputs: [],
} as CalculationUserInputs

describe('SentenceAndOffenceViewModel', () => {
  describe('handles multiple offences to a sentence banner', () => {
    it('shows multiple offences to a sentence banner', () => {
      const sentencesAndOffences = [
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
          offence: { offenceEndDate: '2021-02-03' },
          sentenceAndOffenceAnalysis: 'NEW',
          isSDSPlus: true,
        } as AnalysedSentenceAndOffence,
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
          offence: { offenceStartDate: '2021-01-04', offenceEndDate: '2021-01-05' },
          sentenceAndOffenceAnalysis: 'NEW',
          isSDSPlus: true,
        } as AnalysedSentenceAndOffence,
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
          offence: {
            offenderChargeId: 3933639,
            offenceStartDate: '2018-04-01',
            offenceCode: 'FA06003B',
            offenceDescription: 'Aid and abet fraud by abuse of position',
            indicators: [],
          },
          sentenceAndOffenceAnalysis: 'SAME',
          isSDSPlus: false,
        } as AnalysedSentenceAndOffence,
      ]
      const model = new SentenceAndOffenceViewModel(
        stubbedPrisonerData,
        stubbedUserInput,
        sentencesAndOffences,
        stubbedEmptyAdjustments,
        false,
        true,
        stubbedReturnToCustodyDate,
        null,
        [],
      )
      expect(model.hasMultipleOffencesToASentence()).toStrictEqual(true)
      expect(model.getMultipleOffencesToASentence()).toStrictEqual([[1, 1]])
    })
    it('shows multiple offences to a sentence banner', () => {
      const sentencesAndOffences = [
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
          offence: { offenceEndDate: '2021-02-03' },
          sentenceAndOffenceAnalysis: 'NEW',
          isSDSPlus: true,
        } as AnalysedSentenceAndOffence,
        {
          terms: [
            {
              years: 3,
            },
          ],
          sentenceTypeDescription: 'SDS Standard Sentence',
          caseSequence: 1,
          lineSequence: 2,
          caseReference: 'CASE001',
          courtDescription: 'Court 1',
          sentenceSequence: 1,
          offence: { offenceStartDate: '2021-01-04', offenceEndDate: '2021-01-05' },
          sentenceAndOffenceAnalysis: 'NEW',
          isSDSPlus: true,
        } as AnalysedSentenceAndOffence,
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
          offence: {
            offenderChargeId: 3933639,
            offenceStartDate: '2018-04-01',
            offenceCode: 'FA06003B',
            offenceDescription: 'Aid and abet fraud by abuse of position',
            indicators: [],
          },
          sentenceAndOffenceAnalysis: 'SAME',
          isSDSPlus: false,
        } as AnalysedSentenceAndOffence,
      ]
      const model = new SentenceAndOffenceViewModel(
        stubbedPrisonerData,
        stubbedUserInput,
        sentencesAndOffences,
        stubbedEmptyAdjustments,
        false,
        true,
        stubbedReturnToCustodyDate,
        null,
        [],
      )
      expect(model.hasMultipleOffencesToASentence()).toStrictEqual(false)
      expect(model.getMultipleOffencesToASentence()).toStrictEqual([])
    })
  })
})
