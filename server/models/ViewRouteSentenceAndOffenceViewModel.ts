import {
  AnalysedSentenceAndOffence,
  CalculationSentenceUserInput,
  CalculationUserInputs,
  OffenderOffence,
  SentenceAndOffenceWithReleaseArrangements,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  AnalyzedPrisonApiBookingAndSentenceAdjustments,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
} from '../@types/prisonApi/prisonClientTypes'
import { ErrorMessages } from '../types/ErrorMessages'
import { groupBy, indexBy } from '../utils/utils'
import SentenceTypes from './SentenceTypes'
import ViewRouteAdjustmentsViewModel from './ViewRouteAdjustmentsViewModel'
import ViewRouteCourtCaseTableViewModel from './ViewRouteCourtCaseTableViewModel'

export default class ViewRouteSentenceAndOffenceViewModel {
  public adjustments: ViewRouteAdjustmentsViewModel

  public cases: ViewRouteCourtCaseTableViewModel[]

  public sentenceSequenceToSentence: Map<number, PrisonApiOffenderSentenceAndOffences>

  public offenceCount: number

  public returnToCustodyDate?: string

  public sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]

  public constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public userInputs: CalculationUserInputs,
    sentencesAndOffences: SentenceAndOffenceWithReleaseArrangements[],
    adjustments: AnalyzedPrisonApiBookingAndSentenceAdjustments,
    public viewJourney: boolean,
    returnToCustodyDate?: PrisonApiReturnToCustodyDate,
    public validationErrors?: ErrorMessages,
  ) {
    this.adjustments = new ViewRouteAdjustmentsViewModel(adjustments, sentencesAndOffences)
    this.cases = Array.from(
      groupBy(sentencesAndOffences, (sent: PrisonApiOffenderSentenceAndOffences) => sent.caseSequence).values(),
    )
      .map(sentences => new ViewRouteCourtCaseTableViewModel(sentences))
      .sort((a, b) => a.caseSequence - b.caseSequence)
    this.sentenceSequenceToSentence = indexBy(
      sentencesAndOffences,
      (sent: PrisonApiOffenderSentenceAndOffences) => sent.sentenceSequence,
    )
    this.offenceCount = sentencesAndOffences.length
    this.returnToCustodyDate = returnToCustodyDate?.returnToCustodyDate
    this.sentencesAndOffences = sentencesAndOffences
  }

  public rowIsSdsPlus(sentence: AnalysedSentenceAndOffence, offence: OffenderOffence): boolean {
    const oldUserInputForSDSPlus =
      this.userInputs &&
      this.userInputs.sentenceCalculationUserInputs.find((it: CalculationSentenceUserInput) => {
        return it.offenceCode === offence.offenceCode && it.sentenceSequence === sentence.sentenceSequence
      })
    const isUserIdentifiedSDSPlus = oldUserInputForSDSPlus && oldUserInputForSDSPlus.userChoice
    return isUserIdentifiedSDSPlus || sentence.isSDSPlus
  }

  public isErsedChecked(): boolean {
    return this.userInputs?.calculateErsed === true
  }

  public isErsedElligible(): boolean {
    return this.sentencesAndOffences.some(sentence => SentenceTypes.isSentenceErsedElligible(sentence))
  }

  public isRecallOnly(): boolean {
    return this.sentencesAndOffences.every(sentence => SentenceTypes.isRecall(sentence))
  }

  public hasMultipleOffencesToASentence(): boolean {
    return this.getMultipleOffencesToASentence().length > 0
  }

  public getMultipleOffencesToASentence(): number[][] {
    const array = this.sentencesAndOffences.map(sentence => {
      return { caseSequence: sentence.caseSequence, lineSequence: sentence.lineSequence }
    })
    const elementTracker = {}
    const duplicates = {}

    array.forEach(item => {
      const key = `${item.caseSequence}-${item.lineSequence}`
      if (elementTracker[key]) {
        duplicates[key] = item
      } else {
        elementTracker[key] = true
      }
    })
    return Object.keys(duplicates).map(key => [duplicates[key].caseSequence, duplicates[key].lineSequence])
  }

  hasUnusedRemandOrTaggedBail(): boolean {
    return this.adjustments.unusedRemand.aggregate > 0 || this.adjustments.taggedBail.aggregate > 0
  }

  daysInUnsedRemandOrTaggedBail(): number {
    return this.adjustments.unusedRemand.aggregate + this.adjustments.taggedBail.aggregate
  }

  generateAdjustmentsRows() {
    const adjustmentsRows = []

    const pushAdjustmentDetails = (adjustmentType, adjustmentName, addOrDeduct) => {
      if (this.adjustments[adjustmentType].aggregate !== 0) {
        this.adjustments[adjustmentType].details.forEach(adjustment => {
          adjustmentsRows.push({
            adjustmentName,
            adjustmentType: addOrDeduct,
            adjustmentFrom: adjustment.from,
            adjustmentTo: adjustment.to,
            adjustmentDays: adjustment.days,
          })
        })
      }
    }

    pushAdjustmentDetails('recallSentenceRemand', 'Recall remand', 'deducted')
    pushAdjustmentDetails('remand', 'Remand', 'deducted')
    pushAdjustmentDetails('recallSentenceTaggedBail', 'Recall tagged bail', 'deducted')
    pushAdjustmentDetails('restoredAdditionalDaysAwarded', 'Restored additional days awarded (RADA)', 'deducted')
    pushAdjustmentDetails('additionalDaysAwarded', 'Additional days awarded (ADA)', 'added')
    pushAdjustmentDetails('unlawfullyAtLarge', 'Unlawfully at large', 'added')

    adjustmentsRows.sort((a, b) => new Date(b.adjustmentFrom).getTime() - new Date(a.adjustmentFrom).getTime())

    return adjustmentsRows
  }
}
