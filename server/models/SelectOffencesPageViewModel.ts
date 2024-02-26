import PrisonerContextViewModel from './PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import SelectOffencesViewModel from './SelectOffencesViewModel'
import { ErrorMessages } from '../types/ErrorMessages'

export default class SelectOffencesPageViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public model: SelectOffencesViewModel,
    public validationErrors: ErrorMessages,
  ) {
    super(prisonerDetail)
  }
}
