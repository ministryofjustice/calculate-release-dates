import PrisonerContextViewModel from './PrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { DateSelectConfiguration } from '../services/manualEntryService'

export default class SelectApprovedDatesViewModel extends PrisonerContextViewModel {
  constructor(
    prisonerDetail: PrisonApiPrisoner,
    public calculationRequestId: string,
    public config: DateSelectConfiguration,
    public error?: boolean,
  ) {
    super(prisonerDetail)
  }
}
