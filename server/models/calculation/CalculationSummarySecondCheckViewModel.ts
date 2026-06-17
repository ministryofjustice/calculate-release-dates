import { LatestCalculationCardConfig } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'

export default class CalculationSecondCheckSummaryPageViewModel extends PrisonerContextViewModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public calculationType: string,
    public latestCalculationCardConfig?: LatestCalculationCardConfig,
    public cancelUrl?: string,
    public backLink?: string,
  ) {
    super(prisonerDetail)
  }
}
