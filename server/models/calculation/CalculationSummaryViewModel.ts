import {
  CalculationBreakdown,
  CalculationReason,
  DetailedCalculationResults,
} from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ReleaseDateWithAdjustments from '../../@types/calculateReleaseDates/releaseDateWithAdjustments'
import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'
import { ErrorMessages } from '../../types/ErrorMessages'
import SentenceTypes from '../SentenceTypes'

export default class CalculationSummaryViewModel {
  constructor(
    public calculationRequestId: number,
    public nomsId: string,
    public prisonerDetail: PrisonApiPrisoner,
    public sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    public hasNone: boolean,
    public viewJourney: boolean,
    public calculationType: string,
    public calculationReference: string,
    public ersedEligible: boolean,
    public calculationReason?: CalculationReason,
    public otherReasonDescription?: string,
    public calculationDate?: string,
    public calculationBreakdown?: CalculationBreakdown,
    public releaseDatesWithAdjustments?: ReleaseDateWithAdjustments[],
    public validationErrors?: ErrorMessages,
    public calculationSummaryUnavailable?: boolean,
    public approvedDates?: { [key: string]: string },
    public detailedCalculationResults?: DetailedCalculationResults,
    public hasGenuineOverridesAccess?: boolean,
    public genuineOverrideReasonDescription?: string,
    public calculatedByDisplayName?: string,
    public calculatedAtPrisonDescription?: string,
    public checkedAt?: string,
    public checkedByUsername?: string,
    public checkedByDisplayName?: string,
  ) {
    // intentionally left blank
  }

  public getSDS40ReleaseTranche(): string {
    const tranche = this.detailedCalculationResults?.sds40Tranche
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
    return this.ersedEligible
  }

  public isRecallOnly(): boolean {
    return this.sentencesAndOffences?.every(sentence => SentenceTypes.isRecall(sentence))
  }
}
