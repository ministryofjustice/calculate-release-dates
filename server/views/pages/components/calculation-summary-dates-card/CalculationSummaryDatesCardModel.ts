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

export function nomisCalculationSummaryDatesViewModel(
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
          const qaAttr = `${detailed.type}-release-date-hint-${index}`
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
