type OneThousandCalculationsRow = {
  NOMS_ID: string
  DOB: string
  REQUEST_ID: number
  CALCULATED_DATES: string
  CRD: string
  NOMIS_CRD: string
  NOMIS_CRD_OVERRIDE: string
  LED: string
  NOMIS_LED: string
  NOMIS_LED_CALCULATED: string
  NOMIS_LED_OVERRIDE: string
  SED: string
  NOMIS_SED: string
  NOMIS_SED_CALCULATED: string
  NOMIS_SED_OVERRIDE: string
  NPD: string
  NOMIS_NPD: string
  NOMIS_NPD_OVERRIDE: string
  ARD: string
  NOMIS_ARD: string
  NOMIS_ARD_OVERRIDE: string
  TUSED: string
  NOMIS_TUSED: string
  PED: string
  NOMIS_PED: string
  NOMIS_PED_CALCULATED: string
  NOMIS_PED_OVERRIDE: string
  HDCED: string
  NOMIS_HDCED: string
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
  ESED: string
  NOMIS_ESED: string
  SENTENCE_LENGTH: string
  NOMIS_ESL: string
  NOMIS_JSL: string
  ARE_DATES_SAME: 'Y' | 'N'
  ARE_DATES_SAME_USING_OVERRIDES: 'Y' | 'N'
  IS_ESL_SAME: 'Y' | 'N'
  IS_JSL_SAME: 'Y' | 'N'
  IS_PED_ADJUSTED_TO_CRD: 'Y' | 'N' | ''
  SEX_OFFENDER: 'Y' | 'N'
  LOCATION: string
  SENTENCES: string
  ADJUSTMENTS: string
  RETURN_TO_CUSTODY: string
  FINE_PAYMENTS: string
  CONSECUTIVE_SENTENCES: string
  ERROR_TEXT: string
  ERROR_JSON: string
}

export default OneThousandCalculationsRow
