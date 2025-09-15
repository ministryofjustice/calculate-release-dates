import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'
import {
  ManualEntrySelectedDate,
  SubmittedDate,
} from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { EnteredDate } from '../../services/dateValidationService'

export default class ManualEntryDateEntryViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public backLink: string,
    public date: ManualEntrySelectedDate,
    public previousDate?: SubmittedDate,
    public pageCancelRedirectUrl?: string,
    public error?: string,
    public enteredDate?: EnteredDate,
  ) {
    super(prisonerDetail)
  }
}
