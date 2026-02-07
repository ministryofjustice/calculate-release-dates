import CalculationSummaryViewModel from '../../../../models/calculation/CalculationSummaryViewModel'
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

function getCalculationSummaryDatesCardLine(date: DetailedDate, showHints: boolean): CalculationSummaryDatesCardLine {
  return {
    shortName: date.type,
    fullName: date.description,
    date: date.date,
    hints: showHints
      ? date.hints.map((hint, index) => {
          const qaAttr = `${date.type}-release-date-hint-${index}`
          let hintText = hint.text

          // Check if the hint contains 'HDC policy' and add a link just surrounding the 'HDC policy' text
          if (hint.link && hint.text.includes('HDC policy')) {
            hintText = hint.text.replace(
              'HDC policy',
              `<a class="govuk-link" rel="noreferrer noopener" target="_blank" href="${hint.link}" data-qa="${qaAttr}">HDC policy</a>`,
            )
          } else if (hint.link) {
            hintText = `<a class="govuk-link" rel="noreferrer noopener" target="_blank" href="${hint.link}" data-qa="${qaAttr}">${hint.text}</a>`
          }

          return {
            html: `<p class="govuk-body govuk-hint govuk-!-font-size-16" ${hint.link ? '' : `data-qa="${qaAttr}"`}>${hintText}</p>`,
          }
        })
      : [],
  }
}

export function calculationSummaryDatesCardModelFromCalculationSummaryViewModel(
  model: CalculationSummaryViewModel | NomisCalculationSummary,
  showNoDatesApply: boolean,
  showHints = true,
): CalculationSummaryDatesCardModel {
  const releaseDates: CalculationSummaryDatesCardLine[] = []

  function pushLine(id: string) {
    let detailed: DetailedDate | undefined
    if (model instanceof CalculationSummaryViewModel) {
      detailed = model.detailedCalculationResults.dates[id]
    } else {
      ;[detailed] = model.releaseDates.filter(date => date.type === id)
    }

    if (detailed) {
      releaseDates.push(getCalculationSummaryDatesCardLine(detailed, showHints))
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

export function calculationSummaryDatesCardModelFromOverridesViewModel(
  dates: DetailedDate[],
  showHints = true,
): CalculationSummaryDatesCardModel {
  const releaseDates: CalculationSummaryDatesCardLine[] = dates.map(d =>
    getCalculationSummaryDatesCardLine(d, showHints),
  )
  return {
    showNoDatesApply: false,
    releaseDates,
  }
}
