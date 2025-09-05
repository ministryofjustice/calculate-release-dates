import PrisonerContextViewModel from '../PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'
import { ValidationMessage } from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class ManualEntryLandingPageViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public hasIndeterminateSentences: boolean,
    public pageCancelRedirectUrl?: string,
    public validationMessages?: {
      unsupportedSentenceMessages: ValidationMessage[]
      unsupportedCalculationMessages: ValidationMessage[]
      unsupportedManualMessages: ValidationMessage[]
    },
    public existingManualJourney = false,
  ) {
    super(prisonerDetail)
  }
}
