import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'
import { SubmittedDate } from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { EnteredDate } from '../../services/dateValidationService'
import { ManualEntrySelectedDate } from '../../types/ManualJourney'

export default class ManualEntryDateEntryViewModel extends PrisonerContextViewModel {
  public errorList: [{ text: string; href: string }]

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

  setErrorMessage(error: string, fieldPrefix: string) {
    if (error) {
      this.errorList = [
        {
          text: error,
          href: `#${fieldPrefix}-day`,
        },
      ]
    }
  }
}
