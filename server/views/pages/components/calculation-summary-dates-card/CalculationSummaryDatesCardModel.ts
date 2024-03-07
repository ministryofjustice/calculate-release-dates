import CalculationSummaryViewModel from '../../../../models/CalculationSummaryViewModel'

export default interface CalculationSummaryDatesCardModel {
  showNoDatesApply: boolean
  releaseDates: CalculationSummaryDatesCardLine[]
}

export interface CalculationSummaryDatesCardLine {
  shortName: string
  fullName: string
  /** Format: date */
  date: string
  hints: { html: string }[]
}

export function calculationSummaryDatesCardModelFromCalculationSummaryViewModel(
  model: CalculationSummaryViewModel,
  showNoDatesApply: boolean,
): CalculationSummaryDatesCardModel {
  const releaseDates: CalculationSummaryDatesCardLine[] = []

  function pushLine(id: string, fullName: string, hintsHtml: string[]) {
    if (model.releaseDates[id]) {
      const line: CalculationSummaryDatesCardLine = {
        shortName: id,
        fullName,
        date: model.releaseDates[id],
        hints: hintsHtml.map(str => {
          return { html: str }
        }),
      }
      releaseDates.push(line)
    }
  }

  pushLine('SLED', 'Sentence and licence expiry date', [])
  pushLine('LED', 'Licence expiry date', [])
  pushLine('SED', 'Sentence expiry date', [])
  pushLine('NPD', 'Non parole date', [])
  pushLine('ARD', 'Automatic release date', model.getHints('ARD'))
  pushLine('CRD', 'Conditional release date', model.getHints('CRD'))
  pushLine('PED', 'Parole eligibility date', model.getHints('PED'))
  pushLine('PRRD', 'Post recall release date', model.getHints('PRRD'))
  pushLine('HDCED', 'Home detention curfew eligibility date', model.getHints('HDCED'))
  pushLine('ETD', 'Early transfer date', model.getHints('ETD'))
  pushLine('MTD', 'Mid term date', model.getHints('MTD'))
  pushLine('LTD', 'Late transfer date', model.getHints('LTD'))
  pushLine('TUSED', 'Top up supervision expiry date', model.getHints('TUSED'))
  pushLine('ERSED', 'Early removal scheme eligibility date', model.getHints('ERSED'))
  pushLine('ROTL', 'Release on temporary licence', model.getHints('ROTL'))
  pushLine('HDCAD', 'Home detention curfew approved date', model.getHints('HDCAD'))
  pushLine('DPRRD', 'Detention and training order post recall release date', model.getHints('HDCAD'))
  pushLine('Tariff', 'known as the Tariff expiry date', model.getHints('Tariff'))
  pushLine('TERSED', 'Tariff-expired removal scheme eligibility date', model.getHints('TERSED'))
  pushLine('APD', 'Approved parole date', model.getHints('APD'))

  return {
    showNoDatesApply,
    releaseDates,
  } as CalculationSummaryDatesCardModel
}
