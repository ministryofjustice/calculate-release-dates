import PrintNotificationSlipViewModel from './PrintNotificationSlipViewModel'
import ViewRouteSentenceAndOffenceViewModel from './ViewRouteSentenceAndOffenceViewModel'
import { AnalysedPrisonApiBookingAndSentenceAdjustments } from '../@types/prisonApi/prisonClientTypes'
import KeyDate from './KeyDate'

describe('Print Release Dates Notification Slip', () => {
  describe('dates in correct order for subset of Non DTO dates', () => {
    const prisonerDetail = { offenderNo: 'A1234AA', firstName: 'John', lastName: 'Smith' }
    const adjustments = {
      sentenceAdjustments: [],
      bookingAdjustments: [],
    } as AnalysedPrisonApiBookingAndSentenceAdjustments
    const viewRouteSentenceAndOffenceViewModel = new ViewRouteSentenceAndOffenceViewModel(
      prisonerDetail,
      null,
      [],
      adjustments,
      null,
      null,
      null,
    )
    it('returns undefined when keyDates is empty', () => {
      const keyDates = []
      const model = new PrintNotificationSlipViewModel(
        viewRouteSentenceAndOffenceViewModel,
        null,
        null,
        null,
        keyDates,
        null,
        null,
        null,
        false,
        false,
      )
      const result = model.getNonDTOSubsetOfDaysInOrder()
      expect(result).toBeUndefined()
    })

    it('returns the single keyDate when keyDates has one element', () => {
      const keyDates = [{ code: 'ARD', date: '2022-01-01', description: 'Automatic release date' }]
      const model = new PrintNotificationSlipViewModel(
        viewRouteSentenceAndOffenceViewModel,
        null,
        null,
        null,
        keyDates,
        null,
        null,
        null,
        false,
        false,
      )
      const result = model.getNonDTOSubsetOfDaysInOrder()
      expect(result).toEqual(keyDates[0])
    })

    it('returns the keyDate with the latest date when keyDates has ARD, CRD, and NPD (latest date)', () => {
      const keyDates = [
        { code: 'ARD', date: '2022-01-01', description: 'Automatic release date' },
        { code: 'CRD', date: '2022-02-01', description: 'Conditional release date' },
        { code: 'NPD', date: '2025-02-01', description: 'Non parole date' },
      ]
      const model = new PrintNotificationSlipViewModel(
        viewRouteSentenceAndOffenceViewModel,
        null,
        null,
        null,
        keyDates,
        null,
        null,
        null,
        false,
        false,
      )
      const result = model.getNonDTOSubsetOfDaysInOrder()
      expect(result).toEqual(keyDates[2])
    })

    it('returns the keyDate with the highest priority code when keyDates has ARD and CRD with the same date', () => {
      const keyDates = [
        { code: 'ARD', date: '2022-01-01', description: 'Automatic release date' },
        { code: 'CRD', date: '2022-01-01', description: 'Conditional release date' },
      ]
      const model = new PrintNotificationSlipViewModel(
        viewRouteSentenceAndOffenceViewModel,
        null,
        null,
        null,
        keyDates,
        null,
        null,
        null,
        false,
        false,
      )
      const result = model.getNonDTOSubsetOfDaysInOrder()
      expect(result).toEqual(keyDates[0])
    })

    it('returns the keyDate with the highest priority code when keyDates has PRRD with the latest date', () => {
      const keyDates = [
        { code: 'ARD', date: '2022-01-01', description: 'Automatic release date' },
        { code: 'CRD', date: '2022-01-01', description: 'Conditional release date' },
        { code: 'PRRD', date: '2024-01-01', description: 'Conditional release date' },
      ]
      const model = new PrintNotificationSlipViewModel(
        viewRouteSentenceAndOffenceViewModel,
        null,
        null,
        null,
        keyDates,
        null,
        null,
        null,
        false,
        false,
      )
      const result = model.getNonDTOSubsetOfDaysInOrder()
      expect(result).toEqual(keyDates[2])
    })

    it('returns the keyDate with the highest priority code when keyDates has ARD, CRD, PRRD with the same date', () => {
      const keyDates = [
        { code: 'ARD', date: '2024-01-01', description: 'Automatic release date' },
        { code: 'CRD', date: '2024-01-01', description: 'Conditional release date' },
        { code: 'PRRD', date: '2024-01-01', description: 'Conditional release date' },
      ]
      const model = new PrintNotificationSlipViewModel(
        viewRouteSentenceAndOffenceViewModel,
        null,
        null,
        null,
        keyDates,
        null,
        null,
        null,
        false,
        false,
      )
      const result = model.getNonDTOSubsetOfDaysInOrder()
      expect(result).toEqual(keyDates[0])
    })
  })

  describe('Has key Dates in correct order', () => {
    const prisonerDetail = { offenderNo: 'A1234AA', firstName: 'John', lastName: 'Smith' }
    const adjustments = {
      sentenceAdjustments: [],
      bookingAdjustments: [],
    } as AnalysedPrisonApiBookingAndSentenceAdjustments
    const viewRouteSentenceAndOffenceViewModel = new ViewRouteSentenceAndOffenceViewModel(
      prisonerDetail,
      null,
      [],
      adjustments,
      null,
      null,
      null,
    )

    it('for all dates present in DTO', () => {
      const keyDates: KeyDate[] = [
        { code: 'LTD', date: '2025-06-15', description: 'Late transfer date' },
        { code: 'SED', date: '2022-06-15', description: 'Sentence expiry date' },
        { code: 'MTD', date: '2024-06-15', description: 'Mid transfer date' },
        { code: 'ETD', date: '2023-06-15', description: 'Early transfer date' },
        { code: 'ARD', date: '2026-06-15', description: 'Approved release date' },
        { code: 'TUSED', date: '2027-06-15', description: 'Top up supervision date' },
      ]
      const model = new PrintNotificationSlipViewModel(
        viewRouteSentenceAndOffenceViewModel,
        null,
        null,
        null,
        keyDates,
        null,
        null,
        null,
        false,
        false,
      )
      expect(model.getDTOKeyDatesInOrder()).toEqual([
        { code: 'SED', date: '2022-06-15', description: 'Sentence expiry date' },
        { code: 'ETD', date: '2023-06-15', description: 'Early transfer date' },
        { code: 'MTD', date: '2024-06-15', description: 'Mid transfer date' },
        { code: 'LTD', date: '2025-06-15', description: 'Late transfer date' },
        { code: 'TUSED', date: '2027-06-15', description: 'Top up supervision date' },
      ])
    })

    it('for some dates present in DTO', () => {
      const keyDates: KeyDate[] = [
        { code: 'LTD', date: '2025-06-15', description: 'Late transfer date' },
        { code: 'MTD', date: '2024-06-15', description: 'Mid transfer date' },
        { code: 'ETD', date: '2023-06-15', description: 'Early transfer date' },
      ]
      const model = new PrintNotificationSlipViewModel(
        viewRouteSentenceAndOffenceViewModel,
        null,
        null,
        null,
        keyDates,
        null,
        null,
        null,
        false,
        false,
      )
      expect(model.getDTOKeyDatesInOrder()).toEqual([
        { code: 'ETD', date: '2023-06-15', description: 'Early transfer date' },
        { code: 'MTD', date: '2024-06-15', description: 'Mid transfer date' },
        { code: 'LTD', date: '2025-06-15', description: 'Late transfer date' },
      ])
    })

    it('for all dates present in Non-DTO', () => {
      const keyDates: KeyDate[] = [
        { code: 'LED', date: '2023-06-15', description: 'Licence expiry date' },
        { code: 'SED', date: '2022-06-15', description: 'Sentence expiry date' },
        { code: 'SLED', date: '2024-06-15', description: 'Sentence and licence expiry date' },
        { code: 'HDCAD', date: '2026-06-15', description: 'HDC release date' },
        { code: 'HDCED', date: '2025-06-15', description: 'HDC eligibility date' },
        { code: 'TUSED', date: '2029-06-15', description: 'Top up supervision date' },
        { code: 'ERSED', date: '2028-06-15', description: 'Early Removal Scheme Eligibility Date' },
        { code: 'ROTL', date: '2030-06-15', description: 'Release on temporary licence' },
        { code: 'PED', date: '2027-06-15', description: 'Parole eligibility date' },
        { code: 'ARD', date: '2023-06-15', description: 'Automatic Release Date' },
      ]
      const model = new PrintNotificationSlipViewModel(
        viewRouteSentenceAndOffenceViewModel,
        null,
        null,
        null,
        keyDates,
        null,
        null,
        null,
        false,
        false,
      )
      expect(model.getNonDTOKeyDatesInOrder()).toEqual([
        { code: 'SED', date: '2022-06-15', description: 'Sentence expiry date' },
        { code: 'LED', date: '2023-06-15', description: 'Licence expiry date' },
        { code: 'SLED', date: '2024-06-15', description: 'Sentence and licence expiry date' },
        { code: 'ARD', date: '2023-06-15', description: 'Automatic Release Date' },
        { code: 'HDCED', date: '2025-06-15', description: 'HDC eligibility date' },
        { code: 'HDCAD', date: '2026-06-15', description: 'HDC release date' },
        { code: 'PED', date: '2027-06-15', description: 'Parole eligibility date' },
        { code: 'ERSED', date: '2028-06-15', description: 'Early Removal Scheme Eligibility Date' },
        { code: 'TUSED', date: '2029-06-15', description: 'Top up supervision date' },
        { code: 'ROTL', date: '2030-06-15', description: 'Release on temporary licence' },
      ])
    })

    it('for some dates present in Non-DTO without SED', () => {
      const keyDates: KeyDate[] = [
        { code: 'LED', date: '2023-06-15', description: 'Licence expiry date' },
        { code: 'PRRD', date: '2023-06-15', description: 'Post recall release date' },
        { code: 'HDCED', date: '2025-06-15', description: 'HDC eligibility date' },
        { code: 'HDCAD', date: '2026-06-15', description: 'HDC release date' },
        { code: 'TUSED', date: '2029-06-15', description: 'Top up supervision date' },
        { code: 'ERSED', date: '2028-06-15', description: 'Early Removal Scheme Eligibility Date' },
        { code: 'PED', date: '2027-06-15', description: 'Parole eligibility date' },
        { code: 'SLED', date: '2024-06-15', description: 'Sentence and licence expiry date' },
      ]
      const model = new PrintNotificationSlipViewModel(
        viewRouteSentenceAndOffenceViewModel,
        null,
        null,
        null,
        keyDates,
        null,
        null,
        null,
        false,
        false,
      )
      expect(model.getNonDTOKeyDatesInOrder()).toEqual([
        { code: 'LED', date: '2023-06-15', description: 'Licence expiry date' },
        { code: 'SLED', date: '2024-06-15', description: 'Sentence and licence expiry date' },
        { code: 'PRRD', date: '2023-06-15', description: 'Post recall release date' },
        { code: 'HDCED', date: '2025-06-15', description: 'HDC eligibility date' },
        { code: 'HDCAD', date: '2026-06-15', description: 'HDC release date' },
        { code: 'PED', date: '2027-06-15', description: 'Parole eligibility date' },
        { code: 'ERSED', date: '2028-06-15', description: 'Early Removal Scheme Eligibility Date' },
        { code: 'TUSED', date: '2029-06-15', description: 'Top up supervision date' },
      ])
    })

    it('for some dates present in Non-DTO without SED and LED', () => {
      const keyDates: KeyDate[] = [
        { code: 'PRRD', date: '2023-06-15', description: 'Post recall release date' },
        { code: 'HDCED', date: '2025-06-15', description: 'HDC eligibility date' },
        { code: 'HDCAD', date: '2026-06-15', description: 'HDC release date' },
        { code: 'TUSED', date: '2029-06-15', description: 'Top up supervision date' },
        { code: 'ERSED', date: '2028-06-15', description: 'Early Removal Scheme Eligibility Date' },
        { code: 'PED', date: '2027-06-15', description: 'Parole eligibility date' },
        { code: 'SLED', date: '2024-06-15', description: 'Sentence and licence expiry date' },
      ]
      const model = new PrintNotificationSlipViewModel(
        viewRouteSentenceAndOffenceViewModel,
        null,
        null,
        null,
        keyDates,
        null,
        null,
        null,
        false,
        false,
      )
      expect(model.getNonDTOKeyDatesInOrder()).toEqual([
        { code: 'SLED', date: '2024-06-15', description: 'Sentence and licence expiry date' },
        { code: 'PRRD', date: '2023-06-15', description: 'Post recall release date' },
        { code: 'HDCED', date: '2025-06-15', description: 'HDC eligibility date' },
        { code: 'HDCAD', date: '2026-06-15', description: 'HDC release date' },
        { code: 'PED', date: '2027-06-15', description: 'Parole eligibility date' },
        { code: 'ERSED', date: '2028-06-15', description: 'Early Removal Scheme Eligibility Date' },
        { code: 'TUSED', date: '2029-06-15', description: 'Top up supervision date' },
      ])
    })

    it('for some dates present in Non-DTO without SED, LED and SLED', () => {
      const keyDates: KeyDate[] = [
        { code: 'PRRD', date: '2023-06-15', description: 'Post recall release date' },
        { code: 'HDCED', date: '2025-06-15', description: 'HDC eligibility date' },
        { code: 'HDCAD', date: '2026-06-15', description: 'HDC release date' },
        { code: 'TUSED', date: '2029-06-15', description: 'Top up supervision date' },
        { code: 'ERSED', date: '2028-06-15', description: 'Early Removal Scheme Eligibility Date' },
        { code: 'PED', date: '2027-06-15', description: 'Parole eligibility date' },
      ]
      const model = new PrintNotificationSlipViewModel(
        viewRouteSentenceAndOffenceViewModel,
        null,
        null,
        null,
        keyDates,
        null,
        null,
        null,
        false,
        false,
      )
      expect(model.getNonDTOKeyDatesInOrder()).toEqual([
        { code: 'PRRD', date: '2023-06-15', description: 'Post recall release date' },
        { code: 'HDCED', date: '2025-06-15', description: 'HDC eligibility date' },
        { code: 'HDCAD', date: '2026-06-15', description: 'HDC release date' },
        { code: 'PED', date: '2027-06-15', description: 'Parole eligibility date' },
        { code: 'ERSED', date: '2028-06-15', description: 'Early Removal Scheme Eligibility Date' },
        { code: 'TUSED', date: '2029-06-15', description: 'Top up supervision date' },
      ])
    })
  })
})
