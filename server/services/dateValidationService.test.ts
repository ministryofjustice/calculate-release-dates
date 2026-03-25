import { DateTime } from 'luxon'
import DateValidationService, { EnteredDate, DateInputItem, StorageResponseModel } from './dateValidationService'
import { SubmittedDate } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { ManualEntrySelectedDate, ManualJourneySelectedDate } from '../types/ManualJourney'

function createMockManualDate(dateType: string, dateStr: string): ManualJourneySelectedDate {
  let submittedDate: SubmittedDate = null
  if (dateStr != null) {
    submittedDate = {
      day: DateTime.fromISO(dateStr).day,
      month: DateTime.fromISO(dateStr).month,
      year: DateTime.fromISO(dateStr).year,
    }
  }

  return {
    position: 1,
    dateType,
    completed: true,
    manualEntrySelectedDate: {
      dateType,
      dateText: '',
      date: submittedDate as SubmittedDate,
    } as ManualEntrySelectedDate,
  } as ManualJourneySelectedDate
}

describe('DateValidationService - validateDate', () => {
  const dateValidationService: DateValidationService = new DateValidationService()

  const createMockDate = (day: string, month: string, year: string, dateType: string): EnteredDate => ({
    day,
    month,
    year,
    dateType,
  })

  const createMockDateInputItems = (): DateInputItem[] => [
    { classes: '', name: 'day', value: '' },
    { classes: '', name: 'month', value: '' },
    { classes: '', name: 'year', value: '' },
  ]

  describe('DateValidationService - validateSedLedCrdDates', () => {
    it('should return success when LED is on or before SED', () => {
      const sedDate = createMockManualDate('SED', '2023-12-31')
      const ledDate = createMockManualDate('LED', null)
      const manualDates: ManualJourneySelectedDate[] = [sedDate, ledDate]
      const enteredDate = createMockDate('30', '12', '2023', 'LED')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(true)
      expect(result.message).toBe('')
    })

    it('should return error when LED is after SED', () => {
      const ledDate = createMockManualDate('LED', null)
      const sedDate = createMockManualDate('SED', '2023-12-30')
      const manualDates: ManualJourneySelectedDate[] = [ledDate, sedDate]
      const enteredDate = createMockDate('31', '12', '2023', 'LED')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('The LED must be on or before the SED, which is 30/12/2023')
    })

    it('should return error when SED is after LED', () => {
      const sedDate = createMockManualDate('SED', null)
      const ledDate = createMockManualDate('LED', '2023-12-31')
      const manualDates: ManualJourneySelectedDate[] = [ledDate, sedDate]
      const enteredDate = createMockDate('30', '12', '2023', 'SED')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('The SED must be on or after the LED, which is 31/12/2023')
    })

    it('should return success when SED is on or after CRD', () => {
      const crdDate = createMockManualDate('CRD', '2023-12-01')
      const sedDate = createMockManualDate('SED', null)
      const manualDates: ManualJourneySelectedDate[] = [crdDate, sedDate]
      const enteredDate = createMockDate('02', '12', '2023', 'SED')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(true)
      expect(result.message).toBe('')
    })

    it('should return success when LED is on or after CRD', () => {
      const crdDate = createMockManualDate('CRD', '2023-12-01')
      const ledDate = createMockManualDate('LED', null)
      const manualDates: ManualJourneySelectedDate[] = [crdDate, ledDate]
      const enteredDate = createMockDate('02', '12', '2023', 'LED')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(true)
      expect(result.message).toBe('')
    })

    it('should return error when SED is before CRD', () => {
      const crdDate = createMockManualDate('CRD', '2023-12-02')
      const sedDate = createMockManualDate('SED', null)
      const manualDates: ManualJourneySelectedDate[] = [crdDate, sedDate]
      const enteredDate = createMockDate('01', '12', '2023', 'SED')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('The SED must be on or after the CRD, which is 02/12/2023')
    })

    it('should return error when LED is before CRD', () => {
      const crdDate = createMockManualDate('CRD', '2023-12-02')
      const ledDate = createMockManualDate('LED', null)
      const manualDates: ManualJourneySelectedDate[] = [crdDate, ledDate]
      const enteredDate = createMockDate('01', '12', '2023', 'LED')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('The LED must be on or after the CRD, which is 02/12/2023')
    })

    it('should return success when CRD is on or before LED', () => {
      const ledDate = createMockManualDate('LED', '2023-12-30')
      const crdDate = createMockManualDate('CRD', null)
      const manualDates: ManualJourneySelectedDate[] = [crdDate, ledDate]
      const enteredDate = createMockDate('30', '12', '2023', 'CRD')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(true)
      expect(result.message).toBe('')
    })

    it('should return success when CRD is on or before SED', () => {
      const sedDate = createMockManualDate('SED', '2023-12-30')
      const crdDate = createMockManualDate('CRD', null)
      const manualDates: ManualJourneySelectedDate[] = [crdDate, sedDate]
      const enteredDate = createMockDate('30', '12', '2023', 'CRD')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(true)
      expect(result.message).toBe('')
    })

    it('should return error when CRD is after LED', () => {
      const ledDate = createMockManualDate('LED', '2023-12-30')
      const crdDate = createMockManualDate('CRD', null)
      const manualDates: ManualJourneySelectedDate[] = [crdDate, ledDate]
      const enteredDate = createMockDate('31', '12', '2023', 'CRD')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('The CRD must be on or before the LED, which is 30/12/2023')
    })

    it('should return error when CRD is after SED', () => {
      const sedDate = createMockManualDate('SED', '2023-12-30')
      const crdDate = createMockManualDate('CRD', null)
      const manualDates: ManualJourneySelectedDate[] = [crdDate, sedDate]
      const enteredDate = createMockDate('31', '12', '2023', 'CRD')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('The CRD must be on or before the SED, which is 30/12/2023')
    })

    it('should return success when enteredDate is exactly on the boundary date', () => {
      const sedDate = createMockManualDate('SED', '2023-12-31')
      const ledDate = createMockManualDate('LED', null)
      const manualDates: ManualJourneySelectedDate[] = [sedDate, ledDate]
      const enteredDate = createMockDate('31', '12', '2023', 'LED') // Exactly on SED

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(true)
      expect(result.message).toBe('')
    })
  })

  describe('DateValidationService - validateHdcadHdcedCrdDate', () => {
    it('should return error when HDCAD is before HDCED', () => {
      const hdcedDate = createMockManualDate('HDCED', '2023-12-01')
      const hdcadDate = createMockManualDate('HDCAD', null)
      const manualDates: ManualJourneySelectedDate[] = [hdcedDate, hdcadDate]
      const enteredDate = createMockDate('30', '11', '2023', 'HDCAD')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('The HDCAD must be on or after the HDCED, which is 01/12/2023')
    })

    it('should return success when HDCAD is after HDCED', () => {
      const hdcedDate = createMockManualDate('HDCED', '2023-12-01')
      const hdcadDate = createMockManualDate('HDCAD', null)
      const manualDates: ManualJourneySelectedDate[] = [hdcedDate, hdcadDate]
      const enteredDate = createMockDate('30', '12', '2023', 'HDCAD')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(true)
    })

    it('should return error when HDCED is after HDCAD', () => {
      const hdcadDate = createMockManualDate('HDCAD', '2023-11-30')
      const hdcedDate = createMockManualDate('HDCED', null)
      const manualDates: ManualJourneySelectedDate[] = [hdcadDate, hdcedDate]
      const enteredDate = createMockDate('1', '12', '2023', 'HDCED')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('The HDCED must be on or before the HDCAD, which is 30/11/2023')
    })

    it('should return success when HDCED is before HDCAD', () => {
      const hdcadDate = createMockManualDate('HDCAD', '2023-11-30')
      const hdcedDate = createMockManualDate('HDCED', null)
      const manualDates: ManualJourneySelectedDate[] = [hdcadDate, hdcedDate]
      const enteredDate = createMockDate('1', '11', '2023', 'HDCED')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(true)
    })

    it('should return error when CRD is before HDCED', () => {
      const hdcedDate = createMockManualDate('HDCED', '2023-12-01')
      const crdDate = createMockManualDate('CRD', null)
      const manualDates: ManualJourneySelectedDate[] = [hdcedDate, crdDate]
      const enteredDate = createMockDate('30', '11', '2023', 'CRD')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('The CRD must be after the HDCED, which is 01/12/2023')
    })

    it('should return success when CRD is after HDCED', () => {
      const hdcedDate = createMockManualDate('HDCED', '2023-12-01')
      const crdDate = createMockManualDate('CRD', null)
      const manualDates: ManualJourneySelectedDate[] = [hdcedDate, crdDate]
      const enteredDate = createMockDate('30', '12', '2023', 'CRD')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(true)
    })

    it('should return error when CRD is before HDCAD', () => {
      const hdcadDate = createMockManualDate('HDCAD', '2023-12-01')
      const crdDate = createMockManualDate('CRD', null)
      const manualDates: ManualJourneySelectedDate[] = [hdcadDate, crdDate]
      const enteredDate = createMockDate('30', '11', '2023', 'CRD')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('The CRD must be after the HDCAD, which is 01/12/2023')
    })

    it('should return success when CRD is after HDCAD', () => {
      const hdcadDate = createMockManualDate('HDCAD', '2023-12-01')
      const crdDate = createMockManualDate('CRD', null)
      const manualDates: ManualJourneySelectedDate[] = [hdcadDate, crdDate]
      const enteredDate = createMockDate('30', '12', '2023', 'CRD')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(true)
    })

    it('should return error when HDCED is after CRD', () => {
      const crdDate = createMockManualDate('CRD', '2023-12-01')
      const hdcedDate = createMockManualDate('HDCED', null)
      const manualDates: ManualJourneySelectedDate[] = [crdDate, hdcedDate]
      const enteredDate = createMockDate('02', '12', '2023', 'HDCED')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('The HDCED must be before the CRD, which is 01/12/2023')
    })

    it('should return success when HDCED is before CRD', () => {
      const crdDate = createMockManualDate('CRD', '2023-12-01')
      const hdcedDate = createMockManualDate('HDCED', null)
      const manualDates: ManualJourneySelectedDate[] = [crdDate, hdcedDate]
      const enteredDate = createMockDate('02', '11', '2023', 'HDCED')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(true)
    })

    it('should return error when HDCAD is after CRD', () => {
      const crdDate = createMockManualDate('CRD', '2023-12-01')
      const hdcadDate = createMockManualDate('HDCAD', null)
      const manualDates: ManualJourneySelectedDate[] = [crdDate, hdcadDate]
      const enteredDate = createMockDate('02', '12', '2023', 'HDCAD')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('The HDCAD must be before the CRD, which is 01/12/2023')
    })

    it('should return success when HDCAD is before CRD', () => {
      const crdDate = createMockManualDate('CRD', '2023-12-01')
      const hdcadDate = createMockManualDate('HDCAD', null)
      const manualDates: ManualJourneySelectedDate[] = [crdDate, hdcadDate]
      const enteredDate = createMockDate('02', '11', '2023', 'HDCAD')

      const result: StorageResponseModel = dateValidationService.validateAgainstOtherDates(
        manualDates,
        enteredDate,
        createMockDateInputItems(),
      )

      expect(result.success).toBe(true)
    })
  })
})
