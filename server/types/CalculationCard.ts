import {
  Action,
  LatestCalculationCardConfig,
} from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import { LatestCalculation } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export interface CalculationCard {
  latestCalcCard: LatestCalculationCardConfig
  latestCalcCardAction: Action
  calculation: LatestCalculation
}
