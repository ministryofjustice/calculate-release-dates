import PrisonerContextViewModel from './PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class PreviouslyRecordedSledModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public previouslyRecordedSLED: string,
    public calculatedSLED: string,
    public cancelCalculationLink: string,
    public backLink: string,
  ) {
    super(prisonerDetail)
  }
}
