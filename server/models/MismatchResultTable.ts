import {
  ComparisonMismatchSummary,
  ComparisonOverview,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ComparisonType from '../enumerations/comparisonType'

export default class MismatchResultTable {
  headings: { text: string }[]

  rows: { text?: string; html?: string }[][]

  constructor(comparison: ComparisonOverview, mismatchTypes: string[]) {
    this.headings = this.getHeadings(comparison, comparison.prison)
    this.rows = this.filterAndSortRows(comparison.mismatches, mismatchTypes).map(mismatch =>
      this.createRow(comparison, mismatch),
    )
  }

  private getHeadings(comparison: ComparisonOverview, prison: string) {
    const row = [
      { text: 'Prison number', classes: 'comparison-table-nowrap' },
      { text: 'Surname' },
      this.isAllPrisons(prison) ? { text: 'Establishment' } : undefined,
      { text: 'Validation messages' },
    ]
    if (comparison.comparisonType !== ComparisonType.ESTABLISHMENT_HDCED4PLUS) {
      row.push({ text: 'Details' })
    }
    return row.filter(e => e)
  }

  private filterAndSortRows(mismatches: ComparisonMismatchSummary[], mismatchTypes: string[]) {
    return mismatches
      .filter(mismatch => mismatchTypes.includes(mismatch.misMatchType))
      .sort(this.sortByEstablishmentAndPerson)
  }

  private createRow(
    comparison: ComparisonOverview,
    mismatch: ComparisonMismatchSummary,
  ): ({ text: string } | { html?: string })[] {
    const message = mismatch.validationMessages.map(validationMessage => validationMessage.message).join(', ')

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
      { text: message },
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

  private sortByEstablishmentAndPerson(mismatchA: ComparisonMismatchSummary, mismatchB: ComparisonMismatchSummary) {
    if (mismatchA.establishment != null && mismatchB.establishment != null) {
      const establishmentComparison = mismatchA.establishment.localeCompare(mismatchB.establishment)
      if (establishmentComparison) {
        return establishmentComparison
      }
    }
    return mismatchA.personId.localeCompare(mismatchB.personId)
  }
}
