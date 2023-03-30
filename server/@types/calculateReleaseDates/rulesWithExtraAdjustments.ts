export type AdjustmentDuration = {
  adjustmentValue: number
  type: 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS'
}

export type RulesWithExtraAdjustments = {
  HDCED_GE_MIN_PERIOD_LT_MIDPOINT: AdjustmentDuration
  HDCED_GE_MIDPOINT_LT_MAX_PERIOD: AdjustmentDuration
  HDCED_MINIMUM_CUSTODIAL_PERIOD: AdjustmentDuration
  TUSED_LICENCE_PERIOD_LT_1Y: AdjustmentDuration
  ERSED_ONE_YEAR: AdjustmentDuration
}
