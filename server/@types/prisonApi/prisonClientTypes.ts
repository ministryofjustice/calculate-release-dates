import type * as Api from './generated/types.gen'

export type PrisonApiPrisoner = Api.InmateDetail
export type PrisonApiSentenceDetail = Api.SentenceCalcDates
export type PrisonApiSentenceAdjustmentDetail = Api.SentenceAdjustmentDetail
export type PrisonApiOffenderOffence = Api.OffenderOffence
export type PrisonApiUserCaseloads = Api.CaseLoad
export type PrisonApiSentenceCalcDates = Api.SentenceCalcDates
export type AnalysedPrisonApiBookingAndSentenceAdjustments = Api.BookingAndSentenceAdjustments
export type PrisonApiBookingAdjustment = Api.BookingAdjustment
export type PrisonApiSentenceAdjustmentValues = Api.SentenceAdjustmentValues
export type PrisonApiOffenderFinePayment = Api.OffenderFinePaymentDto
export type PrisonApiOffenderSentenceAndOffences = Api.OffenderSentenceAndOffences
export type PrisonApiOffenderSentenceTerm = Api.OffenderSentenceTerm
export type PrisonApiOffenderKeyDates = Api.OffenderKeyDates
export type PrisonApiFixedTermRecallDetails = Api.FixedTermRecallDetails
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
export type PrisonAPIAssignedLivingUnit = Api.AssignedLivingUnit
