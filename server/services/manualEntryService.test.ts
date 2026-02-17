import { Request } from 'express'
import ManualEntryService from './manualEntryService'
import DateTypeConfigurationService from './dateTypeConfigurationService'
import DateValidationService from './dateValidationService'
import CalculateReleaseDatesService from './calculateReleaseDatesService'

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
})
