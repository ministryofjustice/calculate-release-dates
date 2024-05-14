import CalculationSummaryViewModel from '../../../../models/CalculationSummaryViewModel'
import {
  DetailedDate,
  NomisCalculationSummary,
} from '../../../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

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

export const filteredListOfDates = [
  'SLED',
  'LED',
  'SED',
  'NPD',
  'ARD',
  'CRD',
  'PED',
  'PRRD',
  'HDCED',
  'ETD',
  'MTD',
  'LTD',
  'TUSED',
  'ERSED',
  'ROTL',
  'HDCAD',
  'DPRRD',
  'Tariff',
  'TERSED',
  'APD',
]

export function calculationSummaryDatesCardModelFromCalculationSummaryViewModel(
  model: CalculationSummaryViewModel | NomisCalculationSummary,
  showNoDatesApply: boolean,
): CalculationSummaryDatesCardModel {
  const releaseDates: CalculationSummaryDatesCardLine[] = []

  function pushLine(id: string) {
    let detailed: DetailedDate | undefined
    if (model instanceof CalculationSummaryViewModel) {
      detailed = model.detailedCalculationResults.dates[id]
    } else {
      // eslint-disable-next-line prefer-destructuring
      detailed = model.releaseDates.filter(date => date.type === id)[0]
    }

    if (detailed) {
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

  filteredListOfDates.forEach(date => {
    pushLine(date)
  })

  return {
    showNoDatesApply,
    releaseDates,
  } as CalculationSummaryDatesCardModel
}
