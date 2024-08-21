import PrisonerContextViewModel from './PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class ApprovedDatesQuestionViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public calculationRequestId: string,
    public pageCancelRedirectUrl?: string,
    public error?: boolean,
  ) {
    super(prisonerDetail)
  }
}
