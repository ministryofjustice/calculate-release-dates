import PrisonerContextViewModel from './PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import {
  ManualEntrySelectedDate,
  SubmittedDate,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { EnteredDate } from '../services/dateValidationService'

export default class ApprovedDatesSubmitDateViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public date: ManualEntrySelectedDate,
    public previousDate: SubmittedDate,
    public calculationRequestId?: string,
    public hdced?: string,
    public hdcedWeekendAdjusted?: boolean,
    public error?: string,
    public enteredDate?: EnteredDate,
  ) {
    super(prisonerDetail)
  }
}
