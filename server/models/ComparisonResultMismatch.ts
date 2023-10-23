interface ActionItem {
  href: string
  text: string
  visuallyHiddenText: string
}

export default class ComparisonResultMismatch {
  key: { text: string }

  value: { text: string }

  actions: { items: ActionItem[] }

  constructor(nomsNumber: string, mismatchReason: string, comparisonId: string, mismatchId: string) {
    this.key = { text: nomsNumber }
    this.value = { text: mismatchReason }
    this.actions = {
      items: [
        {
          href: `/compare/result/${comparisonId}/detail/${mismatchId}`,
          text: 'view details',
          visuallyHiddenText: 'name',
        },
      ],
    }
  }
}
