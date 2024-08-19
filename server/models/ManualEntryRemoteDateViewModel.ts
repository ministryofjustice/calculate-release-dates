import PrisonerContextViewModel from './PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class ManualEntryRemoteDateViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public dateToRemove: string,
    public fullDateName: string,
    public redirectUrl?: string,
    public error?: boolean,
  ) {
    super(prisonerDetail)
  }
}
