import {
  Action,
  LatestCalculationCardConfig,
} from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import OptionalPrisonerContextViewModel from './OptionalPrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { LatestCalculation } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { CcrdServiceDefinitions } from '../@types/courtCasesReleaseDatesApi/types'
import { CalculationHistoryModel } from './CalculationHistoryModel'

export default class IndexViewModel extends OptionalPrisonerContextViewModel {
  constructor(
    prisonerDetail?: PrisonApiPrisoner,
    public calculationHistory?: CalculationHistoryModel[],
    public prisonId?: string,
    public allowBulkLoad?: boolean,
    public latestCalculationCardConfig?: LatestCalculationCardConfig,
    public latestCalculationCardAction?: Action,
    public hasNoIndeterminateSentence?: boolean,
    public serviceDefinitions?: CcrdServiceDefinitions,
    public anyThingsToDo?: boolean,
    public latestCalculation?: LatestCalculation,
    public displayMaintenanceAlert?: boolean,
  ) {
    super(prisonerDetail)
  }
}

export function indexViewModelForPrisoner(
  prisonerDetail: PrisonApiPrisoner,
  calculationHistory: CalculationHistoryModel[],
  prisonId: string,
  allowBulkUpload: boolean,
  latestCalculationCardConfig?: LatestCalculationCardConfig,
  latestCalculationCardAction?: Action,
  hasNoIndeterminateSentence?: boolean,
  serviceDefinitions?: CcrdServiceDefinitions,
  latestCalculation?: LatestCalculation,
  displayMaintenanceAlert?: boolean,
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
    Object.values(serviceDefinitions?.services).some(
      it => it.thingsToDo.count > 0 && it.thingsToDo.severity !== 'NOTIFICATION',
    ),
    latestCalculation,
    displayMaintenanceAlert,
  )
}
