import CalculationSummaryViewModel from '../../../../models/CalculationSummaryViewModel'

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

  function pushLine(id: string, fullName: string, hintsHtml: string[]) {
    if (model.approvedDates && model.approvedDates[id]) {
      const line: ApprovedSummaryDatesCardLine = {
        shortName: id,
        fullName,
        date: model.approvedDates[id],
        hints: hintsHtml.map(str => {
          return { html: str }
        }),
      }
      approvedDates.push(line)
    }
  }

  pushLine('APD', 'Approved parole date', model.getHints('APD'))
  pushLine('HDCAD', 'Home detention curfew approved date', model.getHints('HDCAD'))
  pushLine('ROTL', 'Release on temporary licence', model.getHints('ROTL'))

  return {
    approvedDates,
    showActions,
    actionConfig,
  } as ApprovedSummaryDatesCardModel
}
