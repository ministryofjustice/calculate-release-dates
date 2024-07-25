import dayjs from 'dayjs'
import {
  CalculationBreakdown,
  CalculationReason,
  DetailedCalculationResults,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ReleaseDateWithAdjustments from '../@types/calculateReleaseDates/releaseDateWithAdjustments'
import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { ErrorMessages } from '../types/ErrorMessages'
import SentenceTypes from './SentenceTypes'
import config from '../config'

export default class CalculationSummaryViewModel {
  constructor(
    public calculationRequestId: number,
    public nomsId: string,
    public prisonerDetail: PrisonApiPrisoner,
    public sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    public hasNone: boolean,
    public viewJourney: boolean,
    public calculationReference: string,
    public calculationReason?: CalculationReason,
    public otherReasonDescription?: string,
    public calculationDate?: string,
    public calculationBreakdown?: CalculationBreakdown,
    public releaseDatesWithAdjustments?: ReleaseDateWithAdjustments[],
    public validationErrors?: ErrorMessages,
    public calculationSummaryUnavailable?: boolean,
    public approvedDates?: { [key: string]: string },
    public overrideReason?: string,
    public detailedCalculationResults?: DetailedCalculationResults,
    public hasSpecialistSupportEnabled?: boolean,
  ) {
    // intentionally left blank
  }

  public showBreakdown(): boolean {
    return (
      config.featureToggles.showBreakdown &&
      !!this.calculationBreakdown &&
      !this.detailedCalculationResults.dates?.PRRD &&
      !this.calculationBreakdown?.otherDates?.PRRD &&
      this.allSentencesSupported()
    )
  }

  public showSDS40TrancheLabel(): boolean {
    return this.detailedCalculationResults?.tranche !== 'TRANCHE_0'
  }

  public getSDS40ReleaseTranche(): string {
    const tranche = this.detailedCalculationResults?.tranche
    const prefix = 'SDS40 Tranche'
    let result = ''

    if (tranche) {
      switch (tranche) {
        case 'TRANCHE_0':
          result = 'No SDS40 Tranche'
          break
        case 'TRANCHE_1':
          result = `${prefix} 1`
          break
        case 'TRANCHE_2':
          result = `${prefix} 2`
          break
        default:
          result = ''
      }
    }
    return result
  }

  private allSentencesSupported(): boolean {
    return !this.sentencesAndOffences.find(sentence => !SentenceTypes.isSentenceSds(sentence))
  }

  public isErsedEligible(): boolean {
    return this.sentencesAndOffences?.some(sentence => SentenceTypes.isSentenceErsedEligible(sentence))
  }

  public isRecallOnly(): boolean {
    return this.sentencesAndOffences?.every(sentence => SentenceTypes.isRecall(sentence))
  }

  private dateBeforeAnother(dateA: string, dateB: string): boolean {
    if (dateA && dateB) {
      const dayjsDateA = dayjs(dateA)
      const dayjsDateB = dayjs(dateB)
      return dayjsDateA < dayjsDateB
    }
    return false
  }

  public displayHdc4PlusNotificationBanner(): boolean {
    return config.featureToggles.hdc4BannerEnabled && this.detailedCalculationResults.dates?.HDCED != null
  }
}
