import {
  Action,
  LatestCalculationCardConfig,
} from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import OptionalPrisonerContextViewModel from './OptionalPrisonerContextViewModel'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import {
  HistoricCalculationSummary,
  PrisonerCalculationOverview,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import latestCalculationComponentConfig from '../utils/latestCalculation'
import { CcrdServiceDefinitions } from '../@types/courtCasesReleaseDatesApi/types'

export default class PrisonerCalculationOverviewViewModel extends OptionalPrisonerContextViewModel {
  public latestCalculationCardConfig?: LatestCalculationCardConfig

  public latestCalculationCardAction?: Action

  public anyThingsToDo: boolean

  public calculationDate: string

  public calculationReasonDescription: string

  public calculationSource: string

  public calculationSourceDescription: string

  public calculationSourceAdditionalHint?: string

  public calculatedByDisplayName: string

  public calculatedAtEstablishment?: string

  public checkedByDisplayName?: string

  public checkedOnDate?: string

  public numberOfActiveSentences: number

  public hasNoIndeterminateSentence: boolean

  public historicCalculations: HistoricCalculationSummary[]

  public totalCalculationsCount: number

  constructor(
    prisonerCalculationOverview: PrisonerCalculationOverview,
    public serviceDefinitions: CcrdServiceDefinitions,
    public allowBulkLoad: boolean,
    prisonerDetail?: PrisonApiPrisoner,
  ) {
    super(prisonerDetail)
    this.numberOfActiveSentences = prisonerCalculationOverview.numberOfSentences
    this.hasNoIndeterminateSentence = !prisonerCalculationOverview.hasIndeterminateSentences
    if (prisonerCalculationOverview.latestCalculation) {
      const latestCalc = prisonerCalculationOverview.latestCalculation
      this.latestCalculationCardConfig = latestCalculationComponentConfig(latestCalc)
      if (latestCalc.calculationRequestId) {
        this.latestCalculationCardAction = {
          title: 'View details',
          href: `/view/${prisonerDetail.offenderNo}/sentences-and-offences/${latestCalc.calculationRequestId}`,
          dataQa: 'latest-calc-card-action',
        }
        if (latestCalc.source === 'CRDS' && !prisonerCalculationOverview.hasIndeterminateSentences) {
          this.latestCalculationCardConfig.printNotificationSlip = {
            href: `/view/${prisonerDetail.offenderNo}/calculation-summary/${latestCalc.calculationRequestId}/printNotificationSlip?fromPage=view`,
            dataQa: 'release-notification-hook',
          }
        }
      }
      this.calculationSource = latestCalc.source
      this.calculationDate = latestCalc.calculatedAt
      this.calculationReasonDescription = latestCalc.reason ?? 'Not entered'
      this.calculatedByDisplayName = latestCalc.calculatedByDisplayName
      this.calculatedAtEstablishment = latestCalc.establishment
      this.checkedByDisplayName = latestCalc.checkedByDisplayName
      this.checkedOnDate = latestCalc.checkedAt
      if (latestCalc.source === 'NOMIS') {
        this.calculationSourceDescription = 'NOMIS'
      } else if (latestCalc.source === 'CRDS' && latestCalc.calculationType.startsWith('MANUAL')) {
        this.calculationSourceDescription = 'Paper calculation'
        this.calculationSourceAdditionalHint = 'Entered in the Calculate release dates service'
      } else if (latestCalc.source === 'CRDS' && latestCalc.calculationType === 'GENUINE_OVERRIDE') {
        this.calculationSourceDescription = 'User override'
        this.calculationSourceAdditionalHint = latestCalc.genuineOverrideReasonDescription
      } else {
        this.calculationSourceDescription = 'Calculate release dates service'
      }
    }
    this.anyThingsToDo = Object.values(serviceDefinitions?.services).some(
      it => it.thingsToDo.count > 0 && it.thingsToDo.severity !== 'NOTIFICATION',
    )
    this.totalCalculationsCount = prisonerCalculationOverview.totalCalculationCount
    this.historicCalculations = prisonerCalculationOverview.recentCalculations
  }
}
