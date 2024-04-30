import { AnalyzedSentenceAndOffence } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { AnalyzedPrisonApiBookingAndSentenceAdjustments } from '../@types/prisonApi/prisonClientTypes'
import AdjustmentsViewModel from './AdjustmentsViewModel'

describe('AdjustmentsViewModel', () => {
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
    } as AnalyzedSentenceAndOffence,
  ]

  it.each([
    ['RECALL_SENTENCE_REMAND', 'recallSentenceRemand'],
    ['RECALL_SENTENCE_TAGGED_BAIL', 'recallSentenceTaggedBail'],
    ['REMAND', 'remand'],
    ['UNUSED_REMAND', 'unusedRemand'],
    ['TAGGED_BAIL', 'taggedBail'],
  ])(
    'Should filter sentence adjustments by sentences on booking for %s',
    (adjustmentType: string, accessor: string) => {
      const adjustments = {
        sentenceAdjustments: [
          {
            sentenceSequence: 1,
            type: adjustmentType,
            numberOfDays: 2,
            fromDate: '2021-02-01',
            toDate: '2021-02-02',
            active: true,
          },
          {
            sentenceSequence: 8,
            type: adjustmentType,
            numberOfDays: 98765,
            fromDate: '2021-02-01',
            toDate: '2021-02-02',
            active: true,
          },
        ],
        bookingAdjustments: [],
      } as AnalyzedPrisonApiBookingAndSentenceAdjustments

      const model = new AdjustmentsViewModel(adjustments, sentencesAndOffences)
      expect(model[accessor].details).toHaveLength(1)
    },
  )
  it.each([
    ['RECALL_SENTENCE_REMAND', 'recallSentenceRemand'],
    ['RECALL_SENTENCE_TAGGED_BAIL', 'recallSentenceTaggedBail'],
    ['REMAND', 'remand'],
    ['UNUSED_REMAND', 'unusedRemand'],
    ['TAGGED_BAIL', 'taggedBail'],
  ])('Should filter sentence adjustments by is active for %s', (adjustmentType: string, accessor: string) => {
    const adjustments = {
      sentenceAdjustments: [
        {
          sentenceSequence: 1,
          type: adjustmentType,
          numberOfDays: 2,
          fromDate: '2021-02-01',
          toDate: '2021-02-02',
          active: false,
        },
        {
          sentenceSequence: 1,
          type: adjustmentType,
          numberOfDays: 999,
          fromDate: '2021-02-01',
          toDate: '2021-02-02',
          active: true,
        },
      ],
      bookingAdjustments: [],
    } as AnalyzedPrisonApiBookingAndSentenceAdjustments

    const model = new AdjustmentsViewModel(adjustments, sentencesAndOffences)
    expect(model[accessor].details).toHaveLength(1)
    expect(model[accessor].details).toStrictEqual([
      {
        days: 999,
        from: '2021-02-01',
        sentence: 1,
        to: '2021-02-02',
      },
    ])
  })

  it.each([
    ['RECALL_SENTENCE_REMAND', 'recallSentenceRemand'],
    ['RECALL_SENTENCE_TAGGED_BAIL', 'recallSentenceTaggedBail'],
    ['REMAND', 'remand'],
    ['UNUSED_REMAND', 'unusedRemand'],
    ['TAGGED_BAIL', 'taggedBail'],
  ])('Should sort sentence adjustments by from date for %s', (adjustmentType: string, accessor: string) => {
    const adjustments = {
      sentenceAdjustments: [
        {
          sentenceSequence: 1,
          type: adjustmentType,
          numberOfDays: 2,
          fromDate: '2021-02-02',
          toDate: '2021-02-03',
          active: true,
        },
        {
          sentenceSequence: 1,
          type: adjustmentType,
          numberOfDays: 98765,
          fromDate: '2021-02-01',
          toDate: '2021-02-02',
          active: true,
        },
      ],
      bookingAdjustments: [],
    } as AnalyzedPrisonApiBookingAndSentenceAdjustments

    const model = new AdjustmentsViewModel(adjustments, sentencesAndOffences)
    expect(model[accessor].details).toHaveLength(2)
    expect(model[accessor].details).toStrictEqual([
      {
        days: 98765,
        from: '2021-02-01',
        sentence: 1,
        to: '2021-02-02',
      },
      {
        days: 2,
        from: '2021-02-02',
        sentence: 1,
        to: '2021-02-03',
      },
    ])
  })
  it.each([
    ['ADDITIONAL_DAYS_AWARDED', 'additionalDaysAwarded'],
    ['RESTORED_ADDITIONAL_DAYS_AWARDED', 'restoredAdditionalDaysAwarded'],
    ['UNLAWFULLY_AT_LARGE', 'unlawfullyAtLarge'],
  ])('Should sort booking adjustments by from date for %s', (adjustmentType: string, accessor: string) => {
    const adjustments = {
      sentenceAdjustments: [],
      bookingAdjustments: [
        {
          type: adjustmentType,
          numberOfDays: 2,
          fromDate: '2021-03-08',
          toDate: '2021-03-09',
          active: true,
        },
        {
          type: adjustmentType,
          numberOfDays: 200,
          fromDate: '2021-03-07',
          toDate: '2021-03-08',
          active: true,
        },
      ],
    } as AnalyzedPrisonApiBookingAndSentenceAdjustments

    const model = new AdjustmentsViewModel(adjustments, sentencesAndOffences)
    expect(model[accessor].details).toHaveLength(2)
    expect(model[accessor].details).toStrictEqual([
      {
        days: 200,
        from: '2021-03-07',
        sentence: null,
        to: '2021-03-08',
      },
      {
        days: 2,
        from: '2021-03-08',
        sentence: null,
        to: '2021-03-09',
      },
    ])
  })
  it.each([
    ['ADDITIONAL_DAYS_AWARDED', 'additionalDaysAwarded'],
    ['RESTORED_ADDITIONAL_DAYS_AWARDED', 'restoredAdditionalDaysAwarded'],
    ['UNLAWFULLY_AT_LARGE', 'unlawfullyAtLarge'],
  ])('Should filter booking adjustments by is active %s', (adjustmentType: string, accessor: string) => {
    const adjustments = {
      sentenceAdjustments: [],
      bookingAdjustments: [
        {
          type: adjustmentType,
          numberOfDays: 2,
          fromDate: '2021-03-08',
          toDate: '2021-03-09',
          active: true,
        },
        {
          type: adjustmentType,
          numberOfDays: 200,
          fromDate: '2021-03-07',
          toDate: '2021-03-08',
          active: false,
        },
      ],
    } as AnalyzedPrisonApiBookingAndSentenceAdjustments

    const model = new AdjustmentsViewModel(adjustments, sentencesAndOffences)
    expect(model[accessor].details).toHaveLength(1)
    expect(model[accessor].details).toStrictEqual([
      {
        days: 2,
        from: '2021-03-08',
        sentence: null,
        to: '2021-03-09',
      },
    ])
  })
})
