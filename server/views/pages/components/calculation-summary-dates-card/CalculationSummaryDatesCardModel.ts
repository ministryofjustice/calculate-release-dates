import CalculationSummaryViewModel from '../../../../models/CalculationSummaryViewModel'
import { DetailedDate } from '../../../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

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

  function pushLine(id: string) {
    if (model.detailedCalculationResults.dates[id]) {
      const detailed: DetailedDate = model.detailedCalculationResults.dates[id]
      const line: CalculationSummaryDatesCardLine = {
        shortName: detailed.type,
        fullName: detailed.description,
        date: detailed.date,
        hints: detailed.hints.map((hint, index) => {
          if (hint.link) {
            return {
              html: `<p class="govuk-body govuk-hint govuk-!-font-size-16"><a class="govuk-link" rel="noreferrer noopener" target="_blank" data-qa="${detailed.type}-release-date-hint-${index}" href="${hint.link}">${hint.text}</a></p>`,
            }
          }
          return {
            html: `<p class="govuk-body govuk-hint govuk-!-font-size-16" data-qa="${detailed.type}-release-date-hint-${index}">${hint.text}</p>`,
          }
        }),
      }
      releaseDates.push(line)
    }
  }

  pushLine('SLED')
  pushLine('LED')
  pushLine('SED')
  pushLine('NPD')
  pushLine('ARD')
  pushLine('CRD')
  pushLine('PED')
  pushLine('PRRD')
  pushLine('HDCED')
  pushLine('ETD')
  pushLine('MTD')
  pushLine('LTD')
  pushLine('TUSED')
  pushLine('ERSED')
  pushLine('ROTL')
  pushLine('HDCAD')
  pushLine('DPRRD')
  pushLine('Tariff')
  pushLine('TERSED')
  pushLine('APD')

  return {
    showNoDatesApply,
    releaseDates,
  } as CalculationSummaryDatesCardModel
}
