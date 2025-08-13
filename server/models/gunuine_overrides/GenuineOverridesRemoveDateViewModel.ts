import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'

export default class GenuineOverridesRemoveDateViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public dateToRemove: string,
    public fullDateName: string,
    public calculationReference: string,
    public error?: boolean,
  ) {
    super(prisonerDetail)
  }
}
