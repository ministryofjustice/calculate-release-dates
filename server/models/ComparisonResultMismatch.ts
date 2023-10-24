import { ComparisonMismatchSummary } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

interface ActionItem {
  href: string
  text: string
  visuallyHiddenText: string
}

export default class ComparisonResultMismatch {
  key: { text: string }

  value: { text: string }

  actions: { items: ActionItem[] }

  constructor(comparisonMismatchSummary: ComparisonMismatchSummary, comparisonId: string) {
    this.key = { text: comparisonMismatchSummary.personId }
    let message = comparisonMismatchSummary.validationMessages
      .map(validationMessage => validationMessage.message)
      .join(', ')
    if (!comparisonMismatchSummary.isMatch) {
      message = 'Release dates mismatch'
    }
    this.value = {
      text: message,
    }
    this.actions = {
      items: [
        {
          href: `/compare/result/${comparisonId}/detail/${comparisonMismatchSummary.shortReference}`,
          text: 'view details',
          visuallyHiddenText: 'name',
        },
      ],
    }
  }
}
