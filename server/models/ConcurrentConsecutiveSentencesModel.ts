import PrisonerContextViewModel from './PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class ConcurrentConsecutiveSentence extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public validationMessage: string,
    public cancelCalculationLink: string,
    public checkInformationLink: string,
  ) {
    super(prisonerDetail)
  }
}
