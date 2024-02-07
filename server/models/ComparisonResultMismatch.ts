import {
  ComparisonMismatchSummary,
  type ComparisonOverview,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ComparisonType from '../enumerations/comparisonType'

interface ActionItem {
  href: string
  text: string
  visuallyHiddenText: string
}

export default class ComparisonResultMismatch {
  key: { html: string }

  value: { text: string }

  actions: { items: ActionItem[] }

  constructor(comparisonMismatchSummary: ComparisonMismatchSummary, comparison: ComparisonOverview) {
    this.key = {
      html: this.getOffenderDetails(comparisonMismatchSummary, comparison.prison),
    }
    let message = comparisonMismatchSummary.validationMessages
      .map(validationMessage => validationMessage.message)
      .join(', ')
    if (!message && !comparisonMismatchSummary.isMatch) {
      message = 'Release dates mismatch'
    }
    this.value = {
      text: message,
    }
    let href: string
    if (comparison.comparisonType === ComparisonType.MANUAL) {
      href = `/compare/manual/result/${comparison.comparisonShortReference}/detail/${comparisonMismatchSummary.shortReference}`
    } else if (comparison.comparisonType !== ComparisonType.ESTABLISHMENT_HDCED4PLUS) {
      href = `/compare/result/${comparison.comparisonShortReference}/detail/${comparisonMismatchSummary.shortReference}`
    }
    if (href) {
      this.actions = {
        items: [
          {
            href,
            text: 'View details',
            visuallyHiddenText: 'name',
          },
        ],
      }
    }
  }

  private getOffenderDetails(comparisonMismatchSummary: ComparisonMismatchSummary, prison: string) {
    let offenderDetails = `<span class="comparison-person">${comparisonMismatchSummary.personId}</span>`
    if (comparisonMismatchSummary.lastName) {
      offenderDetails += `<span class="comparison-person">${comparisonMismatchSummary.lastName}</span>`
    }

    if (prison === 'all') {
      offenderDetails += `<span>${comparisonMismatchSummary.establishment}</span>`
    }

    return offenderDetails
  }
}
