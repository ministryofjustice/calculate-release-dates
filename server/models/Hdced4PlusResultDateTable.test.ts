import Hdced4PlusResultDateTable from './Hdced4PlusResultDateTable'
import { HdcFourPlusComparisonMismatch } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

describe('Should contain table headings and rows for HDC4+ mismatches', () => {
  describe('with a single prison comparison', () => {
    const prison = 'ABC'
    const mismatches = [
      {
        personId: '123ABC',
        lastName: 'Later Release',
        establishment: prison,
        misMatchType: 'RELEASE_DATES_MISMATCH',
        hdcedFourPlusDate: '2028-06-15',
        releaseDate: { date: '2024-06-15', type: 'CRD' },
      } as HdcFourPlusComparisonMismatch,
      {
        personId: '456DEF',
        lastName: 'Earlier Release',
        establishment: prison,
        misMatchType: 'RELEASE_DATES_MISMATCH',
        hdcedFourPlusDate: '2026-06-15',
        releaseDate: { date: '2022-06-15', type: 'ARD' },
      } as HdcFourPlusComparisonMismatch,
    ]
    it('has all headings except establishment', () => {
      const table = new Hdced4PlusResultDateTable(mismatches, prison)
      expect(table.headings.map(heading => heading.text)).toStrictEqual([
        'Prison number',
        'Surname',
        'HDCED',
        'Release date (type)',
      ])
    })

    it('sorts by HDC4+ date earliest first and formats dates as dd-MM-yyyy', () => {
      const table = new Hdced4PlusResultDateTable(mismatches, prison)
      expect(table.rows.map(row => row.map(column => column.text))).toStrictEqual([
        ['456DEF', 'Earlier Release', '15-06-2026', '15-06-2022 (ARD)'],
        ['123ABC', 'Later Release', '15-06-2028', '15-06-2024 (CRD)'],
      ])
    })
  })

  describe('with all prison comparison', () => {
    const mismatches = [
      {
        personId: '123ABC',
        lastName: 'Later Release',
        establishment: 'ABC',
        misMatchType: 'RELEASE_DATES_MISMATCH',
        hdcedFourPlusDate: '2028-06-15',
        releaseDate: { date: '2024-06-15', type: 'CRD' },
      } as HdcFourPlusComparisonMismatch,
      {
        personId: '456DEF',
        lastName: 'Earlier Release',
        establishment: 'ABC',
        misMatchType: 'RELEASE_DATES_MISMATCH',
        hdcedFourPlusDate: '2026-06-15',
        releaseDate: { date: '2022-06-15', type: 'ARD' },
      } as HdcFourPlusComparisonMismatch,
      {
        personId: '111AAA',
        lastName: 'Middle Release But In First Prison',
        establishment: 'AAA',
        misMatchType: 'RELEASE_DATES_MISMATCH',
        hdcedFourPlusDate: '2027-06-15',
        releaseDate: { date: '2023-06-15', type: 'CRD' },
      } as HdcFourPlusComparisonMismatch,
      {
        personId: '999FFF',
        lastName: 'Latest Release But In First Prison',
        establishment: 'AAA',
        misMatchType: 'RELEASE_DATES_MISMATCH',
        hdcedFourPlusDate: '2029-06-15',
        releaseDate: { date: '2025-06-15', type: 'ARD' },
      } as HdcFourPlusComparisonMismatch,
    ]
    it('has all headings including establishment', () => {
      const table = new Hdced4PlusResultDateTable(mismatches, 'all')
      expect(table.headings.map(heading => heading.text)).toStrictEqual([
        'Prison number',
        'Surname',
        'Establishment',
        'HDCED',
        'Release date (type)',
      ])
    })

    it('sorts by HDC4+ date earliest first and formats dates as dd-MM-yyyy', () => {
      const table = new Hdced4PlusResultDateTable(mismatches, 'all')
      expect(table.rows.map(row => row.map(column => column.text))).toStrictEqual([
        ['111AAA', 'Middle Release But In First Prison', 'AAA', '15-06-2027', '15-06-2023 (CRD)'],
        ['999FFF', 'Latest Release But In First Prison', 'AAA', '15-06-2029', '15-06-2025 (ARD)'],
        ['456DEF', 'Earlier Release', 'ABC', '15-06-2026', '15-06-2022 (ARD)'],
        ['123ABC', 'Later Release', 'ABC', '15-06-2028', '15-06-2024 (CRD)'],
      ])
    })
  })
  describe('is backwards compatible', () => {
    it('and handles missing release date', () => {
      const prison = 'ABC'
      const mismatches = [
        {
          personId: '123ABC',
          lastName: 'Later Release',
          establishment: prison,
          misMatchType: 'RELEASE_DATES_MISMATCH',
          hdcedFourPlusDate: '2028-06-15',
        } as HdcFourPlusComparisonMismatch,
      ]
      const table = new Hdced4PlusResultDateTable(mismatches, prison)
      expect(table.rows.map(row => row.map(column => column.text))).toStrictEqual([
        ['123ABC', 'Later Release', '15-06-2028', ''],
      ])
    })
  })
})
