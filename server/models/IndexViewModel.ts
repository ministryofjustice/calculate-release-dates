import {
  Action,
  LatestCalculationCardConfig,
} from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import OptionalPrisonerContextViewModel from './OptionalPrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { HistoricCalculation } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { CcrdServiceDefinitions } from '../@types/courtCasesReleaseDatesApi/types'

export default class IndexViewModel extends OptionalPrisonerContextViewModel {
  constructor(
    prisonerDetail?: PrisonApiPrisoner,
    public calculationHistory?: HistoricCalculation[],
    public prisonId?: string,
    public allowBulkLoad?: boolean,
    public latestCalculationCardConfig?: LatestCalculationCardConfig,
    public latestCalculationCardAction?: Action,
    public hasNoIndeterminateSentence?: boolean,
    public serviceDefinitions?: CcrdServiceDefinitions,
    public anyThingsToDo?: boolean,
  ) {
    super(prisonerDetail)
  }
}

export function indexViewModelForPrisoner(
  prisonerDetail: PrisonApiPrisoner,
  calculationHistory: HistoricCalculation[],
  prisonId: string,
  allowBulkUpload: boolean,
  latestCalculationCardConfig?: LatestCalculationCardConfig,
  latestCalculationCardAction?: Action,
  hasNoIndeterminateSentence?: boolean,
  serviceDefinitions?: CcrdServiceDefinitions,
): IndexViewModel {
  return new IndexViewModel(
    prisonerDetail,
    calculationHistory,
    prisonId,
    allowBulkUpload,
    latestCalculationCardConfig,
    latestCalculationCardAction,
    hasNoIndeterminateSentence,
    serviceDefinitions,
    Object.values(serviceDefinitions?.services).some(it => it.thingsToDo.count > 0),
  )
}
