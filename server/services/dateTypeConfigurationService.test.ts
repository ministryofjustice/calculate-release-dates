import nock from 'nock'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import DateTypeConfigurationService from './dateTypeConfigurationService'
import config from '../config'
import { ManualJourneySelectedDate } from '../types/ManualJourney'
import CalculateReleaseDatesApiClient from '../data/calculateReleaseDatesApiClient'

const mockAuthenticationClient: AuthenticationClient = {
  getToken: jest.fn().mockResolvedValue('test-system-token'),
} as unknown as jest.Mocked<AuthenticationClient>
const dateTypeConfigurationService = new DateTypeConfigurationService(
  new CalculateReleaseDatesApiClient(mockAuthenticationClient),
)
describe('dateTypeConfigurationService', () => {
  describe('loads date config from backend', () => {
    let fakeApi: nock.Scope

    beforeEach(() => {
      config.apis.calculateReleaseDates.url = 'http://localhost:8100'
      fakeApi = nock(config.apis.calculateReleaseDates.url)
      const dates = [
        { type: 'CRD', description: 'Conditional release date' },
        { type: 'ARD', description: 'Automatic release date' },
        { type: 'None', description: 'None of the above dates apply' },
      ]
      fakeApi.get('/reference-data/date-type', '').reply(200, dates)
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('returns the manual entry date with the date set if already in session', async () => {
      const configured = await dateTypeConfigurationService.configureViaBackend(
        'user1',
        ['CRD', 'ARD'],
        [
          {
            position: 1,
            dateType: 'CRD',
            completed: false,
            manualEntrySelectedDate: {
              dateType: 'CRD',
              dateText: 'CRD (Conditional release date)',
              date: { day: 3, month: 3, year: 2017 },
            },
          } as ManualJourneySelectedDate,
          {
            position: 2,
            dateType: 'ARD',
            completed: false,
            manualEntrySelectedDate: {
              dateType: 'ARD',
              dateText: 'ARD (Automatic release date)',
              date: { day: 4, month: 4, year: 2018 },
            },
          } as ManualJourneySelectedDate,
        ],
      )
      expect(configured).toEqual([
        {
          position: 1,
          dateType: 'CRD',
          completed: false,
          manualEntrySelectedDate: {
            dateType: 'CRD',
            dateText: 'CRD (Conditional release date)',
            date: { day: 3, month: 3, year: 2017 },
          },
        } as ManualJourneySelectedDate,
        {
          position: 2,
          dateType: 'ARD',
          completed: false,
          manualEntrySelectedDate: {
            dateType: 'ARD',
            dateText: 'ARD (Automatic release date)',
            date: { day: 4, month: 4, year: 2018 },
          },
        } as ManualJourneySelectedDate,
      ])
    })
    it('adds a new date type with an undefined date if not in list', async () => {
      const configured = await dateTypeConfigurationService.configureViaBackend('user1', ['CRD'], [])
      expect(configured).toEqual([
        {
          position: 1,
          dateType: 'CRD',
          completed: false,
          manualEntrySelectedDate: {
            dateType: 'CRD',
            dateText: 'CRD (Conditional release date)',
            date: undefined,
          },
        } as ManualJourneySelectedDate,
      ])
    })
    it('should format None correctly', async () => {
      const configured = await dateTypeConfigurationService.configureViaBackend('user1', ['None'], [])
      expect(configured).toEqual([
        {
          position: 1,
          dateType: 'None',
          completed: false,
          manualEntrySelectedDate: {
            dateType: 'None',
            dateText: 'None of the above dates apply',
            date: undefined,
          },
        } as ManualJourneySelectedDate,
      ])
    })
    it('can load all dates as dictionary', async () => {
      const configured = await dateTypeConfigurationService.dateTypeToDescriptionMapping('user1')
      expect(configured).toEqual({
        CRD: 'CRD (Conditional release date)',
        ARD: 'ARD (Automatic release date)',
        None: 'None of the above dates apply',
      })
    })
  })
})
