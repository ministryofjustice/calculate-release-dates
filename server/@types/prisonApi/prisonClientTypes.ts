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
// TODO replace with generated definition when prison-api is fixed.
export type PrisonApiReturnToCustodyDate = {
  bookingId: number
  returnToCustodyDate: string
}
