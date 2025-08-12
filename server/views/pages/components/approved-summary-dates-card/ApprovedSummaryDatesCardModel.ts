import CalculationSummaryViewModel from '../../../../models/calculation/CalculationSummaryViewModel'

export default interface ApprovedSummaryDatesCardModel {
  approvedDates: ApprovedSummaryDatesCardLine[]
  showActions: boolean
  actionConfig?: ApprovedDateActionConfig
}

export interface ApprovedSummaryDatesCardLine {
  shortName: string
  fullName: string
  /** Format: date */
  date: string
  hints: { html: string }[]
}

export interface ApprovedDateActionConfig {
  nomsId: string
  calculationRequestId: number
}

export function approvedSummaryDatesCardModelFromCalculationSummaryViewModel(
  model: CalculationSummaryViewModel,
  showActions: boolean,
  actionConfig?: ApprovedDateActionConfig,
): ApprovedSummaryDatesCardModel {
  const approvedDates: ApprovedSummaryDatesCardLine[] = []

  function pushLine(id: string, fullName: string) {
    if (model.approvedDates && model.approvedDates[id]) {
      const line: ApprovedSummaryDatesCardLine = {
        shortName: id,
        fullName,
        date: model.approvedDates[id],
        hints: [],
      }
      approvedDates.push(line)
    }
  }

  pushLine('APD', 'Approved parole date')
  pushLine('HDCAD', 'Home detention curfew approved date')
  pushLine('ROTL', 'Release on temporary licence')

  return {
    approvedDates,
    showActions,
    actionConfig,
  } as ApprovedSummaryDatesCardModel
}
