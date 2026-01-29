import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { CalculationReason } from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'

export default class CalculationReasonViewModel extends PrisonerContextViewModel {
  protected otherReasonId: string

  protected requiresFurtherDetailsIds: string[]

  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public reasons: CalculationReason[],
    public calculationReasonId?: string,
    public otherReasonDescription?: string,
    public pageCancelRedirectUrl?: string,
  ) {
    super(prisonerDetail)
    this.reasons = reasons
    this.otherReasonId = reasons.find(it => it.isOther === true).id.toString()
    this.requiresFurtherDetailsIds = reasons.filter(it => it.requiresFurtherDetail).map(it => it.id.toString())
  }
}
