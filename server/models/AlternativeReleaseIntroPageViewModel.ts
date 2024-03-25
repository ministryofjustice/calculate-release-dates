import PrisonerContextViewModel from './PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import AlternativeReleaseIntroViewModel from './AlternativeReleaseIntroViewModel'

export default class AlternativeReleaseIntroPageViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public model: AlternativeReleaseIntroViewModel,
  ) {
    super(prisonerDetail)
  }
}
