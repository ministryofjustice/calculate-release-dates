import PrisonerContextViewModel from './PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class CalculationCompleteViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public calculationRequestId: number,
    public noDates: string,
    public hasIndeterminateSentence: boolean,
    public printSlipFeatureToggle: boolean,
  ) {
    super(prisonerDetail)
  }
}
