import { components } from './index'

export type PrisonApiPrisoner = components['schemas']['InmateDetail']
export type PrisonApiSentenceDetail = components['schemas']['SentenceCalcDates']
export type PrisonApiSentenceAdjustmentDetail = components['schemas']['SentenceAdjustmentDetail']
export type PrisonApiOffenderOffence = components['schemas']['OffenderOffence']
export type PrisonApiUserCaseloads = components['schemas']['CaseLoad']
export type PrisonApiSentenceCalcDates = components['schemas']['SentenceCalcDates']
export type AnalysedPrisonApiBookingAndSentenceAdjustments = components['schemas']['BookingAndSentenceAdjustments']
export type PrisonApiBookingAdjustment = components['schemas']['BookingAdjustment']
export type PrisonApiSentenceAdjustmentValues = components['schemas']['SentenceAdjustmentValues']
export type PrisonApiOffenderFinePayment = components['schemas']['OffenderFinePaymentDto']
export type PrisonApiOffenderSentenceAndOffences = components['schemas']['OffenderSentenceAndOffences']
export type PrisonApiOffenderSentenceTerm = components['schemas']['OffenderSentenceTerm']
export type PrisonApiOffenderKeyDates = components['schemas']['OffenderKeyDates']
export type PrisonApiFixedTermRecallDetails = components['schemas']['FixedTermRecallDetails']
export type PrisonApiPrison = components['schemas']['Prison']
export type PrisonApiPrisonDetails = components['schemas']['PrisonDetails']
export type PrisonApiOffenderCalculatedKeyDates = PrisonApiOffenderKeyDates & {
  earlyRemovalSchemeEligibilityDate: string
  releaseOnTemporaryLicenceDate: string
  judiciallyImposedSentenceLength: string
  comment: string
  reasonCode: string
}
//  TODO Could be removed with a refactor
//   it was being returned by two apis (prison-api and crd-api) - have refactored prison-api call to use PrisonApiFixedTermRecallDetails
export type PrisonApiReturnToCustodyDate = {
  bookingId: number
  returnToCustodyDate: string
}
export type PrisonAPIAssignedLivingUnit = components['schemas']['AssignedLivingUnit']
