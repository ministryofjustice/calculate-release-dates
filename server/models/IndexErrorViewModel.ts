import {
  Action,
  LatestCalculationCardConfig,
} from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import OptionalPrisonerContextViewModel from './OptionalPrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { HistoricCalculation } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { CcrdServiceDefinitions } from '../@types/courtCasesReleaseDatesApi/types'
import { FullPageError } from '../types/FullPageError'

export default class IndexErrorViewModel extends OptionalPrisonerContextViewModel {
  constructor(
    public error: FullPageError,
    prisonerDetail?: PrisonApiPrisoner,
    public calculationHistory?: HistoricCalculation[],
    public prisonId?: string,
    public allowBulkLoad?: boolean,
    public latestCalculationCardConfig?: LatestCalculationCardConfig,
    public latestCalculationCardAction?: Action,
    public hasNoIndeterminateSentence?: boolean,
    public serviceDefinitions?: CcrdServiceDefinitions,
  ) {
    super(prisonerDetail)
  }
}

export function indexErrorViewModelForPrisoner(
  error: FullPageError,
  prisonerDetail: PrisonApiPrisoner,
  calculationHistory: HistoricCalculation[],
  prisonId: string,
  allowBulkUpload: boolean,
  serviceDefinitions?: CcrdServiceDefinitions,
): IndexErrorViewModel {
  return new IndexErrorViewModel(
    error,
    prisonerDetail,
    calculationHistory,
    prisonId,
    allowBulkUpload,
    null,
    null,
    null,
    serviceDefinitions,
  )
}
