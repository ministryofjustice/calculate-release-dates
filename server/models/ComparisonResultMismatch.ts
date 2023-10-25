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

  constructor(comparisonMismatchSummary: ComparisonMismatchSummary, comparisonId: string, isManual: boolean) {
    this.key = { text: comparisonMismatchSummary.personId }
    let message = comparisonMismatchSummary.validationMessages
      .map(validationMessage => validationMessage.message)
      .join(', ')
    if (!message && !comparisonMismatchSummary.isMatch) {
      message = 'Release dates mismatch'
    }
    this.value = {
      text: message,
    }
    let href = `/compare/result/${comparisonId}/detail/${comparisonMismatchSummary.shortReference}`
    if (isManual) {
      href = `/compare/manual/result/${comparisonId}/detail/${comparisonMismatchSummary.shortReference}`
    }
    this.actions = {
      items: [
        {
          href,
          text: 'view details',
          visuallyHiddenText: 'name',
        },
      ],
    }
  }
}
