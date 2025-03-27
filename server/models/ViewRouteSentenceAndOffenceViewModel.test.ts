import {
  CalculationUserInputs,
  SentenceAndOffenceWithReleaseArrangements,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ViewRouteSentenceAndOffenceViewModel from './ViewRouteSentenceAndOffenceViewModel'
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

const stubbedAdjustments = {
  bookingAdjustments: [
    {
      active: true,
      fromDate: '2022-01-01',
      toDate: '2022-01-08',
      numberOfDays: 8,
      type: 'ADDITIONAL_DAYS_AWARDED',
    },
    { active: true, fromDate: '2022-02-01', toDate: '2022-01-08', numberOfDays: 8, type: 'UNLAWFULLY_AT_LARGE' },
    {
      active: true,
      fromDate: '2022-03-01',
      toDate: '2022-01-08',
      numberOfDays: 8,
      type: 'RESTORED_ADDITIONAL_DAYS_AWARDED',
    },
  ],
  sentenceAdjustments: [
    { active: true, fromDate: '2022-05-01', toDate: '2024-03-03', numberOfDays: 3, type: 'REMAND' },
    { active: true, fromDate: '2022-06-01', toDate: '2024-03-19', numberOfDays: 15, type: 'TAGGED_BAIL' },
    { active: true, fromDate: '2022-07-01', toDate: '2024-03-19', numberOfDays: 15, type: 'UNUSED_REMAND' },
    {
      active: true,
      fromDate: '2022-08-01',
      toDate: '2024-03-19',
      numberOfDays: 15,
      type: 'RECALL_SENTENCE_TAGGED_BAIL',
    },
    {
      active: true,
      fromDate: '2022-09-01',
      toDate: '2024-03-19',
      numberOfDays: 15,
      type: 'RECALL_SENTENCE_REMAND',
    },
  ],
}
const sentenceCalculationType = 'CALCULATION'

describe('ViewRouteSentenceAndOffenceViewModel', () => {
  describe('handles multiple offences to a sentence banner', () => {
    it('shows multiple offences to a sentence banner', () => {
      const sentencesAndOffences = [
        {
          caseSequence: 1,
          hasAnSDSEarlyReleaseExclusion: 'NO',
          isSDSPlus: false,
          isSDSPlusEligibleSentenceTypeLengthAndOffence: false,
          isSDSPlusOffenceInPeriod: false,
          lineSequence: 1,
          offence: { indicators: [], offenceCode: '', offenceDescription: '', offenderChargeId: 0 },
          sentenceCalculationType: 'SDS Standard Sentence',
          sentenceCategory: '2003',
          sentenceDate: '',
          sentenceSequence: 1,
          sentenceStatus: '',
          sentenceTypeDescription: '',
          terms: [
            {
              years: 3,
              code: 'AAA',
              days: 0,
              weeks: 0,
              months: 0,
            },
          ],
          bookingId: 123,
        } as SentenceAndOffenceWithReleaseArrangements,
        {
          caseSequence: 1,
          hasAnSDSEarlyReleaseExclusion: 'NO',
          isSDSPlus: false,
          isSDSPlusEligibleSentenceTypeLengthAndOffence: false,
          isSDSPlusOffenceInPeriod: false,
          lineSequence: 1,
          offence: { offenceStartDate: '2021-01-04', offenceEndDate: '2021-01-05' },
          sentenceCalculationType: 'SDS Standard Sentence',
          sentenceCategory: '2003',
          sentenceDate: '',
          sentenceSequence: 1,
          sentenceStatus: '',
          sentenceTypeDescription: '',
          terms: [
            {
              years: 3,
              code: 'AAA',
              days: 0,
              weeks: 0,
              months: 0,
            },
          ],
          bookingId: 123,
        } as SentenceAndOffenceWithReleaseArrangements,
        {
          caseSequence: 1,
          hasAnSDSEarlyReleaseExclusion: 'NO',
          isSDSPlus: false,
          isSDSPlusEligibleSentenceTypeLengthAndOffence: false,
          isSDSPlusOffenceInPeriod: false,
          lineSequence: 1,
          offence: {
            offenderChargeId: 3933639,
            offenceStartDate: '2018-04-01',
            offenceCode: 'FA06003B',
            offenceDescription: 'Aid and abet fraud by abuse of position',
            indicators: [],
          },
          sentenceCalculationType: 'LR_LASPO_DR',
          sentenceCategory: '2003',
          sentenceDate: '2018-06-15',
          sentenceSequence: 5,
          sentenceStatus: '',
          sentenceTypeDescription: '',
          terms: [
            { years: 0, months: 40, weeks: 0, days: 0, code: 'IMP' },
            { years: 0, months: 32, weeks: 0, days: 0, code: 'LIC' },
          ],
          bookingId: 123,
        } as SentenceAndOffenceWithReleaseArrangements,
      ]
      const model = new ViewRouteSentenceAndOffenceViewModel(
        stubbedPrisonerData,
        stubbedUserInput,
        sentencesAndOffences,
        stubbedEmptyAdjustments,
        false,
        sentenceCalculationType,
        stubbedReturnToCustodyDate,
        null,
      )
      expect(model.hasMultipleOffencesToASentence()).toStrictEqual(true)
      expect(model.getMultipleOffencesToASentence()).toStrictEqual([[1, 1]])
    })
    it('shows multiple offences to a sentence banner', () => {
      const sentencesAndOffences = [
        {
          caseSequence: 1,
          hasAnSDSEarlyReleaseExclusion: 'NO',
          isSDSPlus: false,
          isSDSPlusEligibleSentenceTypeLengthAndOffence: false,
          isSDSPlusOffenceInPeriod: false,
          lineSequence: 1,
          offence: { offenceEndDate: '2021-02-03' },
          sentenceCalculationType: 'SDS Standard Sentence',
          sentenceCategory: '',
          sentenceDate: '',
          sentenceSequence: 1,
          sentenceStatus: '',
          sentenceTypeDescription: '',
          terms: [
            {
              years: 3,
              code: 'AAA',
              days: 0,
              weeks: 0,
              months: 0,
            },
          ],
          bookingId: 123,
        } as SentenceAndOffenceWithReleaseArrangements,
        {
          caseSequence: 1,
          hasAnSDSEarlyReleaseExclusion: 'NO',
          isSDSPlus: false,
          isSDSPlusEligibleSentenceTypeLengthAndOffence: false,
          isSDSPlusOffenceInPeriod: false,
          lineSequence: 2,
          offence: { offenceStartDate: '2021-01-04', offenceEndDate: '2021-01-05' },
          sentenceCalculationType: 'SDS Standard Sentence',
          sentenceCategory: '',
          sentenceDate: '',
          sentenceSequence: 1,
          sentenceStatus: '',
          sentenceTypeDescription: '',
          terms: [
            {
              years: 3,
              code: 'AAA',
              days: 0,
              weeks: 0,
              months: 0,
            },
          ],
          bookingId: 123,
        } as SentenceAndOffenceWithReleaseArrangements,
        {
          caseSequence: 5,
          hasAnSDSEarlyReleaseExclusion: 'NO',
          isSDSPlus: false,
          isSDSPlusEligibleSentenceTypeLengthAndOffence: false,
          isSDSPlusOffenceInPeriod: false,
          lineSequence: 5,
          offence: {
            offenderChargeId: 3933639,
            offenceStartDate: '2018-04-01',
            offenceCode: 'FA06003B',
            offenceDescription: 'Aid and abet fraud by abuse of position',
            indicators: [],
          },
          sentenceCalculationType: 'LR_LASPO_DR',
          sentenceCategory: '',
          sentenceDate: '',
          sentenceSequence: 5,
          sentenceStatus: '',
          sentenceTypeDescription: '',
          terms: [
            { years: 0, months: 40, weeks: 0, days: 0, code: 'IMP' },
            { years: 0, months: 32, weeks: 0, days: 0, code: 'LIC' },
          ],
          bookingId: 123,
        } as SentenceAndOffenceWithReleaseArrangements,
      ]
      const model = new ViewRouteSentenceAndOffenceViewModel(
        stubbedPrisonerData,
        stubbedUserInput,
        sentencesAndOffences,
        stubbedEmptyAdjustments,
        false,
        sentenceCalculationType,
        stubbedReturnToCustodyDate,
        null,
      )
      expect(model.hasMultipleOffencesToASentence()).toStrictEqual(false)
      expect(model.getMultipleOffencesToASentence()).toStrictEqual([])
    })
  })
  it('should return correct days for tagged bail or unused remand', () => {
    const model = new ViewRouteSentenceAndOffenceViewModel(
      stubbedPrisonerData,
      stubbedUserInput,
      [],
      stubbedAdjustments as AnalysedPrisonApiBookingAndSentenceAdjustments,
      false,
      sentenceCalculationType,
      stubbedReturnToCustodyDate,
      null,
    )
    const numberOfDaysDeducted = model.daysInUnsedRemand()
    expect(numberOfDaysDeducted).toStrictEqual(15)
  })
  it('should generate adjustments array correctly', () => {
    const model = new ViewRouteSentenceAndOffenceViewModel(
      stubbedPrisonerData,
      stubbedUserInput,
      [],
      stubbedAdjustments as AnalysedPrisonApiBookingAndSentenceAdjustments,
      false,
      sentenceCalculationType,
      stubbedReturnToCustodyDate,
      null,
    )
    const adjustmentsArray = model.generateAdjustmentsRows()
    expect(adjustmentsArray).toStrictEqual([
      {
        adjustmentName: 'Recall remand',
        adjustmentType: 'deducted',
        adjustmentFrom: '2022-09-01',
        adjustmentTo: '2024-03-19',
        adjustmentDays: 15,
      },
      {
        adjustmentName: 'Recall tagged bail',
        adjustmentType: 'deducted',
        adjustmentFrom: '2022-08-01',
        adjustmentTo: '2024-03-19',
        adjustmentDays: 15,
      },
      {
        adjustmentName: 'Tagged bail',
        adjustmentType: 'deducted',
        adjustmentFrom: '2022-06-01',
        adjustmentTo: '2024-03-19',
        adjustmentDays: 15,
      },
      {
        adjustmentName: 'Remand',
        adjustmentType: 'deducted',
        adjustmentFrom: '2022-05-01',
        adjustmentTo: '2024-03-03',
        adjustmentDays: 3,
      },
      {
        adjustmentName: 'Restored additional days awarded (RADA)',
        adjustmentType: 'deducted',
        adjustmentFrom: '2022-03-01',
        adjustmentTo: '2022-01-08',
        adjustmentDays: 8,
      },
      {
        adjustmentName: 'Unlawfully at large',
        adjustmentType: 'added',
        adjustmentFrom: '2022-02-01',
        adjustmentTo: '2022-01-08',
        adjustmentDays: 8,
      },
      {
        adjustmentName: 'Additional days awarded (ADA)',
        adjustmentType: 'added',
        adjustmentFrom: '2022-01-01',
        adjustmentTo: '2022-01-08',
        adjustmentDays: 8,
      },
    ])
  })
})
