import {
  Action,
  LatestCalculationCardConfig,
} from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'

export interface CalculationCard {
  latestCalcCard: LatestCalculationCardConfig
  latestCalcCardAction: Action
}
