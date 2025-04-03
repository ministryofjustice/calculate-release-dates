import { ThingToDo } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import PrisonerContextViewModel from './PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class ThingsToDoInterceptViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public thingsToDo: ThingToDo[],
  ) {
    super(prisonerDetail)
  }
}
