import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'
import { BookingCalculation } from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class GenuineOverridesConfirmViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public calculation: BookingCalculation,
  ) {
    super(prisonerDetail)
  }
}
