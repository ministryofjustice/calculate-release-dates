import PrisonerContextViewModel from './PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { SubmittedDate } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { EnteredDate } from '../services/dateValidationService'
import { ManualEntrySelectedDate } from '../types/ManualJourney'

export default class ApprovedDatesSubmitDateViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public backLink: string,
    public date: ManualEntrySelectedDate,
    public previousDate: SubmittedDate,
    public calculationRequestId?: string,
    public hdced?: string,
    public hdcedWeekendAdjusted?: boolean,
    public pageCancelRedirectUrl?: string,
    public error?: string,
    public enteredDate?: EnteredDate,
  ) {
    super(prisonerDetail)
  }
}
