import {
  Action,
  LatestCalculationCardConfig,
} from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import ErrorMessage from './ErrorMessage'

export interface CalculationCard {
  latestCalcCard: LatestCalculationCardConfig
  latestCalcCardAction: Action
}

export const isCalculationCard = (card: CalculationCard | ErrorMessage): card is CalculationCard => {
  return Object.prototype.hasOwnProperty.call(card, 'latestCalcCard')
}
