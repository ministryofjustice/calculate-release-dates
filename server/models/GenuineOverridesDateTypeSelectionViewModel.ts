import PrisonerContextViewModel from './PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { DateSelectConfiguration } from '../services/manualEntryService'

export default class GenuineOverridesDateTypeSelectionViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public config: DateSelectConfiguration,
    public calculationReference: string,
    public insufficientDatesSelected?: boolean,
  ) {
    super(prisonerDetail)
  }
}
