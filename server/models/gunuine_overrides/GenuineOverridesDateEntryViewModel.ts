import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'
import {
  ManualEntrySelectedDate,
  SubmittedDate,
} from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { EnteredDate } from '../../services/dateValidationService'

export default class GenuineOverridesDateEntryViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public date: ManualEntrySelectedDate,
    public calculationReference: string,
    public previousDate?: SubmittedDate,
    public enteredDate?: EnteredDate,
    public error?: string,
  ) {
    super(prisonerDetail)
  }
}
