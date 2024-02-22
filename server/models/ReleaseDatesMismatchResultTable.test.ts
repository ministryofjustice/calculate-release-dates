import {
  ComparisonMismatchSummary,
  ComparisonOverview,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import MismatchResultTable from './MismatchResultTable'
import ReleaseDatesMismatchResultTable from './ReleaseDatesMismatchResultTable'

describe('Should contain table headings and rows for release date mismatches', () => {
  describe('with a single prison comparison', () => {
    const mismatches = [
      {
        personId: 'ZXY738',
        lastName: 'last name 1',
        isValid: true,
        isMatch: false,
        establishment: 'DEF',
        validationMessages: [
          {
            code: 'A_FINE_SENTENCE_CONSECUTIVE_TO',
            arguments: [],
            message: 'A default term is consecutive to another default term or sentence',
            type: 'VALIDATION',
          },
        ],
        misMatchType: 'VALIDATION_ERROR',
        shortReference: 'ref-1',
        releaseDate: { date: '2024-06-15', type: 'CRD' },
        sdsSentencesIdentified: {},
      } as ComparisonMismatchSummary,
      {
        personId: 'HDW924',
        lastName: 'last name 2',
        establishment: 'DEF',
        isValid: true,
        isMatch: true,
        validationMessages: [],
        misMatchType: 'RELEASE_DATES_MISMATCH',
        shortReference: 'ref-2',
        releaseDate: { date: '2022-06-15', type: 'ARD' },
        sdsSentencesIdentified: {},
      } as ComparisonMismatchSummary,
      {
        personId: 'ABC123',
        lastName: 'last name 3',
        establishment: 'DEF',
        isValid: true,
        isMatch: true,
        validationMessages: [],
        misMatchType: 'RELEASE_DATES_MISMATCH',
        shortReference: 'ref-3',
        releaseDate: { date: '2022-06-15', type: 'ARD' },
        sdsSentencesIdentified: {},
      } as ComparisonMismatchSummary,
    ]
    const comparison = {
      comparisonShortReference: 'comparison-ref',
      prison: 'HMI',
      comparisonType: 'ESTABLISHMENT_FULL',
      calculatedAt: '2024-06-15',
      calculatedByUsername: 'me',
      numberOfMismatches: 2,
      numberOfPeopleCompared: 5,
      mismatches,
      status: 'COMPLETED',
      hdc4PlusCalculated: [],
    } as ComparisonOverview

    it('has all headings except establishment', () => {
      const table = new ReleaseDatesMismatchResultTable(comparison)
      expect(table.headings.map(heading => heading.text)).toStrictEqual([
        'Prison number',
        'Surname',
        'Mismatch type',
        'Details',
      ])
    })
  })

  describe('with all prison comparison', () => {
    const mismatches = [
      {
        personId: 'ZXY738',
        lastName: 'last name 1',
        establishment: 'DEF',
        isValid: true,
        isMatch: false,
        validationMessages: [
          {
            code: 'A_FINE_SENTENCE_CONSECUTIVE_TO',
            arguments: [],
            message: 'A default term is consecutive to another default term or sentence',
            type: 'VALIDATION',
          },
        ],
        misMatchType: 'VALIDATION_ERROR',
        shortReference: 'ref-1',
        releaseDate: { date: '2024-06-15', type: 'CRD' },
        sdsSentencesIdentified: {},
      } as ComparisonMismatchSummary,
      {
        personId: 'HDG321',
        lastName: 'last name 2',
        establishment: 'ABC',
        isValid: true,
        isMatch: true,
        validationMessages: [],
        misMatchType: 'RELEASE_DATES_MISMATCH',
        shortReference: 'ref-2',
        releaseDate: { date: '2022-06-15', type: 'ARD' },
        sdsSentencesIdentified: {},
      } as ComparisonMismatchSummary,
      {
        personId: 'ABC123',
        lastName: 'last name 3',
        establishment: 'DEF',
        isValid: true,
        isMatch: true,
        validationMessages: [],
        misMatchType: 'RELEASE_DATES_MISMATCH',
        shortReference: 'ref-3',
        releaseDate: { date: '2022-06-15', type: 'ARD' },
        sdsSentencesIdentified: {},
      } as ComparisonMismatchSummary,
    ]
    const comparison = {
      comparisonShortReference: 'comparison-ref',
      prison: 'all',
      comparisonType: 'ESTABLISHMENT_FULL',
      calculatedAt: '2024-06-15',
      calculatedByUsername: 'me',
      numberOfMismatches: 3,
      numberOfPeopleCompared: 5,
      mismatches,
      status: 'COMPLETED',
      hdc4PlusCalculated: [],
    } as ComparisonOverview

    it('has all headings including establishment', () => {
      const table = new ReleaseDatesMismatchResultTable(comparison)
      expect(table.headings.map(heading => heading.text)).toStrictEqual([
        'Prison number',
        'Surname',
        'Establishment',
        'Mismatch type',
        'Details',
      ])
    })

    it('filters out non release date mismatches', () => {
      const table = new ReleaseDatesMismatchResultTable(comparison)
      expect(
        table.rows.map(row =>
          row.map(column => {
            if (column.text !== undefined) {
              return column.text
            }
            return column.html
          }),
        ),
      ).toStrictEqual([
        [
          'HDG321',
          'last name 2',
          'ABC',
          'Release dates mismatch',
          '<a class="govuk-link" href=/compare/result/comparison-ref/detail/ref-2>View details</a>',
        ],
        [
          'ABC123',
          'last name 3',
          'DEF',
          'Release dates mismatch',
          '<a class="govuk-link" href=/compare/result/comparison-ref/detail/ref-3>View details</a>',
        ],
      ])
    })
  })
})
