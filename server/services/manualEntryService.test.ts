import { Request } from 'express'
import ManualEntryService from './manualEntryService'
import DateTypeConfigurationService from './dateTypeConfigurationService'
import DateValidationService from './dateValidationService'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import { ErrorMessages } from '../types/ErrorMessages'
import { ManualJourneySelectedDate } from '../types/ManualJourney'

jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/dateTypeConfigurationService')

describe('manualEntryService', () => {
  const dateTypeConfigurationService = new DateTypeConfigurationService(
    null,
  ) as jest.Mocked<DateTypeConfigurationService>
  const dateValidationService = new DateValidationService()
  const calculateReleaseDatesService = new CalculateReleaseDatesService(
    null,
    null,
  ) as jest.Mocked<CalculateReleaseDatesService>
  const manualEntryService = new ManualEntryService(
    dateTypeConfigurationService,
    dateValidationService,
    calculateReleaseDatesService,
  )
  const req = { user: {}, session: {} } as Request

  const mockDateConfigs = {
    CRD: 'CRD',
    LED: 'LED',
    SED: 'SED',
    NPD: 'NPD',
    ARD: 'ARD',
    TUSED: 'TUSED',
    PED: 'PED',
    SLED: 'SLED',
    HDCED: 'HDCED',
    NCRD: 'NCRD',
    ETD: 'ETD',
    MTD: 'MTD',
    LTD: 'LTD',
    DPRRD: 'DPRRD',
    PRRD: 'PRRD',
    ESED: 'ESED',
    ERSED: 'ERSED',
    TERSED: 'TERSED',
    APD: 'APD',
    HDCAD: 'HDCAD',
    Tariff: 'Tariff',
    ROTL: 'ROTL',
    None: 'None',
  }

  beforeEach(() => {
    calculateReleaseDatesService.validateDatesForManualEntry.mockResolvedValue({
      messages: [],
      messageType: null,
    })
    dateTypeConfigurationService.dateTypeToDescriptionMapping.mockResolvedValue(mockDateConfigs)
  })

  it('should provide relevant date config when there are no indeterminate sentences', async () => {
    const { config } = await manualEntryService.verifySelectedDateType(req, 'A1234BC', false, true, [], 'user1')
    expect(config.items.map(it => it.value)).toStrictEqual([
      'SED',
      'LED',
      'CRD',
      'HDCED',
      'TUSED',
      'PRRD',
      'PED',
      'ROTL',
      'ERSED',
      'ARD',
      'HDCAD',
      'MTD',
      'ETD',
      'LTD',
      'APD',
      'NPD',
      'DPRRD',
    ])
  })

  it('should provide relevant date config when there are indeterminate sentences', async () => {
    const { config } = await manualEntryService.verifySelectedDateType(req, 'A1234BC', true, true, [], 'user1')
    expect(config.items.map(it => it.value || it.divider)).toStrictEqual([
      'Tariff',
      'TERSED',
      'ROTL',
      'APD',
      'PED',
      'or',
      'None',
    ])
  })

  describe('validateHdcadWithHdced', () => {
    it('should add a validation message if HDCAD is selected without HDCED', () => {
      const existingDates: ManualJourneySelectedDate[] = []
      const selectedDateTypes = ['HDCAD']
      const firstLoad = false
      const validationMessages: ErrorMessages = { messages: [], messageType: null }
      manualEntryService.validateHdcadWithHdced(existingDates, selectedDateTypes, firstLoad, validationMessages)
      expect(validationMessages.messages).toEqual([{ text: 'HDCED must be selected with HDCAD' }])
    })

    it('should add a validation message if HDCAD is in existing dates and HDCED is not selected', () => {
      const existingDates = [{ dateType: 'HDCAD' }] as ManualJourneySelectedDate[]
      const selectedDateTypes: string[] = []
      const firstLoad = false
      const validationMessages: ErrorMessages = { messages: [], messageType: null }
      manualEntryService.validateHdcadWithHdced(existingDates, selectedDateTypes, firstLoad, validationMessages)
      expect(validationMessages.messages).toEqual([{ text: 'HDCED must be selected with HDCAD' }])
    })

    it('should not add a validation message if HDCAD and HDCED are both selected', () => {
      const existingDates: ManualJourneySelectedDate[] = []
      const selectedDateTypes = ['HDCAD', 'HDCED']
      const firstLoad = false
      const validationMessages: ErrorMessages = { messages: [], messageType: null }
      manualEntryService.validateHdcadWithHdced(existingDates, selectedDateTypes, firstLoad, validationMessages)
      expect(validationMessages.messages).toEqual([])
    })

    it('should not add a validation message if only HDCED is selected', () => {
      const existingDates: ManualJourneySelectedDate[] = []
      const selectedDateTypes = ['HDCED']
      const firstLoad = false
      const validationMessages: ErrorMessages = { messages: [], messageType: null }
      manualEntryService.validateHdcadWithHdced(existingDates, selectedDateTypes, firstLoad, validationMessages)
      expect(validationMessages.messages).toEqual([])
    })

    it('should not add a validation message if neither HDCAD nor HDCED are selected', () => {
      const existingDates: ManualJourneySelectedDate[] = []
      const selectedDateTypes = ['CRD']
      const firstLoad = false
      const validationMessages: ErrorMessages = { messages: [], messageType: null }
      manualEntryService.validateHdcadWithHdced(existingDates, selectedDateTypes, firstLoad, validationMessages)
      expect(validationMessages.messages).toEqual([])
    })

    it('should not add a validation message if HDCAD is selected on first load', () => {
      const existingDates: ManualJourneySelectedDate[] = []
      const selectedDateTypes = ['HDCAD']
      const firstLoad = true
      const validationMessages: ErrorMessages = { messages: [], messageType: null }
      manualEntryService.validateHdcadWithHdced(existingDates, selectedDateTypes, firstLoad, validationMessages)
      expect(validationMessages.messages).toEqual([])
    })
  })

  describe('validateRemovedDate', () => {
    const nomsId = 'A1234BC'
    let testReq: Request

    beforeEach(() => {
      testReq = {
        user: {},
        session: {
          selectedManualEntryDates: {
            [nomsId]: [],
          },
        },
        query: {},
        body: {},
      } as unknown as Request
    })

    it('should return an error if no radio button is selected', () => {
      const result = manualEntryService.validateRemovedDate(testReq, nomsId)
      expect(result).toBe("You must select either 'Yes' or 'No'")
    })

    it("should return null if 'no' is selected", () => {
      testReq.body = { 'remove-date': 'no' }
      const result = manualEntryService.validateRemovedDate(testReq, nomsId)
      expect(result).toBeNull()
    })

    it("should return null if 'yes' is selected for a non-HDCED date", () => {
      testReq.body = { 'remove-date': 'yes' }
      testReq.query.dateType = 'CRD'
      const result = manualEntryService.validateRemovedDate(testReq, nomsId)
      expect(result).toBeNull()
    })

    it('should return an error if trying to remove HDCED when HDCAD exists', () => {
      testReq.body = { 'remove-date': 'yes' }
      testReq.query.dateType = 'HDCED'
      testReq.session.selectedManualEntryDates[nomsId] = [{ dateType: 'HDCAD' }] as ManualJourneySelectedDate[]
      const result = manualEntryService.validateRemovedDate(testReq, nomsId)
      expect(result).toBe('HDCED cannot be deleted because a HDCAD still exists. You must delete the HDCAD first.')
    })

    it('should return null if trying to remove HDCED when HDCAD does not exist', () => {
      testReq.body = { 'remove-date': 'yes' }
      testReq.query.dateType = 'HDCED'
      testReq.session.selectedManualEntryDates[nomsId] = [{ dateType: 'CRD' }] as ManualJourneySelectedDate[]
      const result = manualEntryService.validateRemovedDate(testReq, nomsId)
      expect(result).toBeNull()
    })
  })
})
