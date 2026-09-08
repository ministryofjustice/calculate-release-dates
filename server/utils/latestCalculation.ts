import {
  LatestCalculationCardConfig,
  LatestCalculationCardDate,
  LatestCalculationCardDateHint,
} from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import { LatestCalculation } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default function latestCalculationComponentConfig(
  latestCalculation: LatestCalculation,
): LatestCalculationCardConfig {
  const dates: LatestCalculationCardDate[] = Object.values(latestCalculation.dates).map(date => {
    const cardDate: LatestCalculationCardDate = {
      type: date.type,
      description: date.description,
      date: date.date,
      hints: date.hints.map(hint => {
        const cardHint: LatestCalculationCardDateHint = {
          text: hint.text,
          href: hint.link ?? '',
        }
        return cardHint
      }),
    }
    return cardDate
  })
  return {
    source: latestCalculation.source,
    calculatedAt: latestCalculation.calculatedAt,
    establishment: latestCalculation.establishment ?? '',
    reason: latestCalculation.reason,
    dates,
  }
}
