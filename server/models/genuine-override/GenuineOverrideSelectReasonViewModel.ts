import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'
import { GenuineOverrideReason } from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class GenuineOverrideSelectReasonViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public reasons: GenuineOverrideReason[],
    public reason: string | undefined,
    public reasonFurtherDetail: string | undefined,
    public backLink: string,
    public pageCancelRedirectUrl: string,
  ) {
    super(prisonerDetail)
  }
}
