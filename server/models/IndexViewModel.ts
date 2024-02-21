import OptionalPrisonerContextViewModel from './OptionalPrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class IndexViewModel extends OptionalPrisonerContextViewModel {
  constructor(
    prisonerDetail?: PrisonApiPrisoner,
    public prisonId?: string,
    public reason?: boolean,
    public allowBulkLoad?: boolean,
  ) {
    super(prisonerDetail)
  }
}

export function indexViewModelForPrisoner(
  prisonerDetail: PrisonApiPrisoner,
  prisonId: string,
  reason: boolean,
): IndexViewModel {
  return new IndexViewModel(prisonerDetail, prisonId, reason, undefined)
}

export function indexViewModelWithNoPrisoner(allowBulkLoad: boolean, prisonId?: string): IndexViewModel {
  return new IndexViewModel(undefined, prisonId, undefined, allowBulkLoad)
}
