import { Action, LatestCalculationCardConfig } from 'hmpps-court-cases-release-dates-design/hmpps/@types'
import OptionalPrisonerContextViewModel from './OptionalPrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { HistoricCalculation } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class IndexViewModel extends OptionalPrisonerContextViewModel {
  constructor(
    prisonerDetail?: PrisonApiPrisoner,
    public calculationHistory?: HistoricCalculation[],
    public prisonId?: string,
    public allowBulkLoad?: boolean,
    public latestCalculationCardConfig?: LatestCalculationCardConfig,
    public latestCalculationCardAction?: Action,
  ) {
    super(prisonerDetail)
  }
}

export function indexViewModelForPrisoner(
  prisonerDetail: PrisonApiPrisoner,
  calculationHistory: HistoricCalculation[],
  prisonId: string,
  allowBulkUpload: boolean,
  latestCalculationCardConfig?: LatestCalculationCardConfig,
  latestCalculationCardAction?: Action,
): IndexViewModel {
  return new IndexViewModel(
    prisonerDetail,
    calculationHistory,
    prisonId,
    allowBulkUpload,
    latestCalculationCardConfig,
    latestCalculationCardAction,
  )
}
