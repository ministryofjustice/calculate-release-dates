import {
  ComparisonMismatchSummary,
  ComparisonOverview,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ComparisonType from '../enumerations/comparisonType'

export default class ReleaseDatesMismatchResultTable {
  headings: { text: string }[]

  rows: { text?: string; html?: string }[][]

  constructor(comparison: ComparisonOverview) {
    this.headings = this.getHeadings(comparison.prison)
    this.rows = comparison.mismatches
      .filter(mismatch => mismatch.misMatchType === 'RELEASE_DATES_MISMATCH')
      .map(mismatch => this.createRow(comparison, mismatch))
  }

  private getHeadings(prison: string) {
    return [
      { text: 'Prison number', classes: 'comparison-table-nowrap' },
      { text: 'Surname' },
      this.isAllPrisons(prison) ? { text: 'Establishment' } : undefined,
      { text: 'Mismatch type' },
      { text: 'Details' },
    ].filter(e => e)
  }

  private createRow(
    comparison: ComparisonOverview,
    mismatch: ComparisonMismatchSummary,
  ): ({ text: string } | { html: string })[] {
    let detailsHref: string
    if (comparison.comparisonType === ComparisonType.MANUAL) {
      detailsHref = `/compare/manual/result/${comparison.comparisonShortReference}/detail/${mismatch.shortReference}`
    } else if (comparison.comparisonType !== ComparisonType.ESTABLISHMENT_HDCED4PLUS) {
      detailsHref = `/compare/result/${comparison.comparisonShortReference}/detail/${mismatch.shortReference}`
    }

    const row: ({ text: string } | { html: string })[] = [
      { text: mismatch.personId },
      { text: mismatch.lastName },
      this.isAllPrisons(comparison.prison) ? { text: mismatch.establishment } : undefined,
      { text: 'Release dates mismatch' },
    ]

    if (detailsHref) {
      row.push({
        html: `<a class="govuk-link" href=${detailsHref}>View details</a>`,
      })
    }
    return row.filter(e => e)
  }

  private isAllPrisons(prison: string) {
    return prison === 'all'
  }
}
