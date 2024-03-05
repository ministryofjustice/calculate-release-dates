import OptionalPrisonerContextViewModel from './OptionalPrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { HistoricCalculation } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class IndexViewModel extends OptionalPrisonerContextViewModel {
  constructor(
    prisonerDetail?: PrisonApiPrisoner,
    public calculationHistory?: HistoricCalculation[],
    public prisonId?: string,
    public reason?: boolean,
    public allowBulkLoad?: boolean,
  ) {
    super(prisonerDetail)
  }
}

export function indexViewModelForPrisoner(
  prisonerDetail: PrisonApiPrisoner,
  calculationHistory: HistoricCalculation[],
  prisonId: string,
  reason: boolean,
): IndexViewModel {
  return new IndexViewModel(prisonerDetail, calculationHistory, prisonId, reason, undefined)
}

export function indexViewModelWithNoPrisoner(allowBulkLoad: boolean, prisonId?: string): IndexViewModel {
  return new IndexViewModel(undefined, undefined, prisonId, undefined, allowBulkLoad)
}
