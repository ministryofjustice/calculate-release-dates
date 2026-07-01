export interface CalculationHistoryModel {
  calculationReason: string | null | undefined
  calculationDate: string
  calculationSource: string
  calculatedByDisplayName: string | null
  calculationType: string | null | undefined
  establishment: string | null | undefined
  genuineOverrideReasonDescription: string | null | undefined
  offenderNo: string | null
  offenderSentCalculationId: number | null | undefined
  calculationRequestId: number | null | undefined
  commentText: string | null | undefined
}
