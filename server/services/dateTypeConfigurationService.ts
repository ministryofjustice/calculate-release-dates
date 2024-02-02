import { ManualEntrySelectedDate } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export const FULL_STRING_LOOKUP = {
  SED: 'SED (Sentence expiry date)',
  LED: 'LED (Licence expiry date)',
  CRD: 'CRD (Conditional release date)',
  HDCED: 'HDCED (Home detention curfew release date)',
  TUSED: 'TUSED (Top up supervision expiry date)',
  PRRD: 'PRRD (Post recall release date)',
  PED: 'PED (Parole eligibility date)',
  ROTL: 'ROTL (Release on temporary licence)',
  ERSED: 'ERSED (Early removal scheme eligibility date)',
  ARD: 'ARD (Automatic release date)',
  HDCAD: 'HDCAD (Home detention curfew approved date)',
  MTD: 'MTD (Mid transfer date)',
  ETD: 'ETD (Early transfer date)',
  LTD: 'LTD (Late transfer date)',
  APD: 'APD (Approved parole date)',
  NPD: 'NPD (Non-parole date)',
  DPRRD: 'DPRRD (Detention and training order post recall release date)',
  Tariff: 'Tariff (known as the Tariff expiry date)',
  TERSED: 'TERSED (Tariff-expired removal scheme eligibility date)',
  None: 'None of the above dates apply',
}

export default class DateTypeConfigurationService {
  public configure(dateList: string | string[], sessionList: ManualEntrySelectedDate[]): ManualEntrySelectedDate[] {
    const selectedDateTypes: string[] = Array.isArray(dateList) ? dateList : [dateList]
    return selectedDateTypes
      .map((date: string) => {
        if (date !== undefined) {
          const existingDate = sessionList.find((d: ManualEntrySelectedDate) => d !== undefined && d.dateType === date)
          if (existingDate) {
            return {
              dateType: date,
              dateText: FULL_STRING_LOOKUP[date],
              date: existingDate.date,
            } as ManualEntrySelectedDate
          }
          return {
            dateType: date,
            dateText: FULL_STRING_LOOKUP[date],
            date: undefined,
          } as ManualEntrySelectedDate
        }
        return null
      })
      .filter(obj => obj !== null)
  }
}
