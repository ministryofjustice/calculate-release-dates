import { components } from './index'

export type PrisonApiPrisoner = components['schemas']['InmateDetail']
export type PrisonApiSentenceDetail = components['schemas']['SentenceCalcDates']
export type PrisonApiSentenceAdjustmentDetail = components['schemas']['SentenceAdjustmentDetail']
export type PrisonApiOffenderOffence = components['schemas']['OffenderOffence']
export type PrisonApiUserCaseloads = components['schemas']['CaseLoad']
export type PrisonApiSentenceCalcDates = components['schemas']['SentenceCalcDates']
export type PrisonApiBookingAndSentenceAdjustments = components['schemas']['BookingAndSentenceAdjustments']
export type PrisonApiBookingAdjustment = components['schemas']['BookingAdjustment']
export type PrisonApiSentenceAdjustmentValues = components['schemas']['SentenceAdjustmentValues']
export type PrisonApiOffenderFinePayment = components['schemas']['OffenderFinePaymentDto']
export type PrisonApiOffenderSentenceAndOffences = components['schemas']['OffenderSentenceAndOffences']
export type PrisonApiOffenderSentenceTerm = components['schemas']['OffenderSentenceTerm']
export type PrisonApiOffenderKeyDates = components['schemas']['OffenderKeyDates']
export type PrisonApiOffenderCalculatedKeyDates = PrisonApiOffenderKeyDates & {
  earlyRemovalSchemeEligibilityDate: string
  releaseOnTemporaryLicenceDate: string
  judiciallyImposedSentenceLength: string
  comment: string
  reasonCode: string
}
// TODO replace with generated definition when prison-api is fixed.
//  This was being returned by two apis (prison-api and crd-api) - have refactored prison-api call to use PrisonApiFixedTermRecallDetails
export type PrisonApiReturnToCustodyDate = {
  bookingId: number
  returnToCustodyDate: string
}

export type PrisonApiFixedTermRecallDetails = {
  bookingId: number
  returnToCustodyDate: string
  recallLength: number
}
