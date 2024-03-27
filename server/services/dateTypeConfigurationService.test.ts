import nock from 'nock'
import DateTypeConfigurationService from './dateTypeConfigurationService'
import { ManualEntrySelectedDate } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import config from '../config'

const dateTypeConfigurationService = new DateTypeConfigurationService()
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
        'token',
        ['CRD', 'ARD'],
        [
          {
            dateType: 'CRD',
            dateText: 'CRD (Conditional release date)',
            date: { day: 3, month: 3, year: 2017 },
          } as ManualEntrySelectedDate,
          {
            dateType: 'ARD',
            dateText: 'ARD (Automatic release date)',
            date: { day: 4, month: 4, year: 2018 },
          } as ManualEntrySelectedDate,
        ],
      )
      expect(configured).toEqual([
        {
          dateType: 'CRD',
          dateText: 'CRD (Conditional release date)',
          date: { day: 3, month: 3, year: 2017 },
        } as ManualEntrySelectedDate,
        {
          dateType: 'ARD',
          dateText: 'ARD (Automatic release date)',
          date: { day: 4, month: 4, year: 2018 },
        } as ManualEntrySelectedDate,
      ])
    })
    it('adds a new date type with an undefined date if not in list', async () => {
      const configured = await dateTypeConfigurationService.configureViaBackend('token', ['CRD'], [])
      expect(configured).toEqual([
        {
          dateType: 'CRD',
          dateText: 'CRD (Conditional release date)',
          date: undefined,
        } as ManualEntrySelectedDate,
      ])
    })
    it('should format None correctly', async () => {
      const configured = await dateTypeConfigurationService.configureViaBackend('token', ['None'], [])
      expect(configured).toEqual([
        {
          dateType: 'None',
          dateText: 'None of the above dates apply',
          date: undefined,
        } as ManualEntrySelectedDate,
      ])
    })
    it('can load all dates as dictionary', async () => {
      const configured = await dateTypeConfigurationService.dateTypeToDescriptionMapping('token')
      expect(configured).toEqual({
        CRD: 'CRD (Conditional release date)',
        ARD: 'ARD (Automatic release date)',
        None: 'None of the above dates apply',
      })
    })
  })
})
