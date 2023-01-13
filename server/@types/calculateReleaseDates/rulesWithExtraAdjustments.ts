export type AdjustmentDuration = {
  adjustmentValue: number
  type: 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS'
}

export type RulesWithExtraAdjustments = {
  HDCED_GE_12W_LT_18M: AdjustmentDuration
  HDCED_GE_18M_LT_4Y: AdjustmentDuration
  HDCED_MINIMUM_14D: AdjustmentDuration
  TUSED_LICENCE_PERIOD_LT_1Y: AdjustmentDuration
  ERSED_ONE_YEAR: AdjustmentDuration
}
