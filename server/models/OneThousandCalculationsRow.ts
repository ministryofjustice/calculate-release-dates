type OneThousandCalculationsRow = {
  NOMS_ID: string
  DOB: string
  REQUEST_ID: number
  CALCULATED_DATES: string
  CRD: string
  NOMIS_CRD: string
  NOMIS_CRD_OVERRIDE: string
  CRD_MATCH: string
  LED: string
  NOMIS_LED: string
  NOMIS_LED_CALCULATED: string
  NOMIS_LED_OVERRIDE: string
  LED_MATCH: string
  SED: string
  NOMIS_SED: string
  NOMIS_SED_CALCULATED: string
  NOMIS_SED_OVERRIDE: string
  SED_MATCH: string
  NPD: string
  NOMIS_NPD: string
  NOMIS_NPD_OVERRIDE: string
  NPD_MATCH: string
  ARD: string
  NOMIS_ARD: string
  NOMIS_ARD_OVERRIDE: string
  ARD_MATCH: string
  TUSED: string
  NOMIS_TUSED: string
  NOMIS_TUSED_CALCULATED: string
  NOMIS_TUSED_OVERRIDE: string
  TUSED_MATCH: string
  PED: string
  NOMIS_PED: string
  NOMIS_PED_CALCULATED: string
  NOMIS_PED_OVERRIDE: string
  PED_MATCH: string
  HDCED: string
  NOMIS_HDCED: string
  NOMIS_HDCED_CALCULATED: string
  NOMIS_HDCED_OVERRIDE: string
  HDCED_MATCH: string
  ETD: string
  NOMIS_ETD: string
  MTD: string
  NOMIS_MTD: string
  LTD: string
  NOMIS_LTD: string
  DPRRD: string
  NOMIS_DPRRD: string
  NOMIS_DPRRD_OVERRIDE: string
  PRRD: string
  NOMIS_PRRD: string
  NOMIS_PRRD_OVERRIDE: string
  PRRD_MATCH: string
  ESED: string
  NOMIS_ESED: string
  ERSED: string
  NOMIS_ERSED: string
  ERSED_MATCH: string
  NOMIS_ROTL: string
  COMMENT: string
  REASON_CODE: string
  SENTENCE_LENGTH: string
  NOMIS_ESL: string
  NOMIS_JSL: string
  IS_ESL_SAME: 'Y' | 'N'
  IS_JSL_SAME: 'Y' | 'N'
  IS_PED_ADJUSTED_TO_CRD: 'Y' | 'N' | ''
  IS_HDCED_14_DAY_RULE: 'Y' | 'N' | ''
  HAS_SDS_PLUS_PCSC: 'Y' | 'N' | ''
  SEX_OFFENDER: 'Y' | 'N'
  LOCATION: string
  SENTENCES: string
  ADJUSTMENTS: string
  RETURN_TO_CUSTODY: string
  FINE_PAYMENTS: string
  CONSECUTIVE_SENTENCES: string
  ERROR_TEXT: string
  ERROR_JSON: string
  ALL_DATES_MATCH: 'Y' | 'N'
}

export default OneThousandCalculationsRow
