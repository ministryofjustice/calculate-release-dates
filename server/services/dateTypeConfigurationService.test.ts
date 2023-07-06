import DateTypeConfigurationService from './dateTypeConfigurationService'
import { ManualEntrySelectedDate } from '../models/ManualEntrySelectedDate'

const dateTypeConfigurationService = new DateTypeConfigurationService()
describe('dateTypeConfigurationService', () => {
  it('returns the manual entry date with the date set if already in session', () => {
    const configured = dateTypeConfigurationService.configure(
      ['CRD'],
      [
        {
          dateType: 'CRD',
          dateText: 'CRD (Conditional release date)',
          date: { day: '03', month: '03', year: '2017' },
        } as ManualEntrySelectedDate,
      ]
    )
    expect(configured).toEqual([
      {
        dateType: 'CRD',
        dateText: 'CRD (Conditional release date)',
        date: { day: '03', month: '03', year: '2017' },
      } as ManualEntrySelectedDate,
    ])
  })
  it('adds a new date type with an undefined date if not in list', () => {
    const configured = dateTypeConfigurationService.configure(['CRD'], [])
    expect(configured).toEqual([
      {
        dateType: 'CRD',
        dateText: 'CRD (Conditional release date)',
        date: undefined,
      } as ManualEntrySelectedDate,
    ])
  })
})
