import { DateTime } from 'luxon'
import { HdcFourPlusComparisonMismatch } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class Hdced4PlusResultDateTable {
  headings: { text: string }[]

  rows: { text: string }[][]

  constructor(hdc4PlusCalculated: HdcFourPlusComparisonMismatch[], prison: string) {
    this.headings = this.getHeadings(prison)
    this.rows = this.filterAndSortRows(hdc4PlusCalculated).map(mismatch => this.createRow(mismatch, prison))
  }

  private getHeadings(prison: string) {
    return [
      { text: 'Prison number' },
      { text: 'Surname' },
      this.isAllPrisons(prison) ? { text: 'Establishment' } : undefined,
      { text: 'HDCED' },
      { text: 'Release date (type)' },
    ].filter(e => e)
  }

  private filterAndSortRows(hdc4PlusCalculated: HdcFourPlusComparisonMismatch[]) {
    return hdc4PlusCalculated
      .filter(mismatch => !['VALIDATION_ERROR', 'VALIDATION_ERROR_HDC4_PLUS'].includes(mismatch.misMatchType))
      .filter(mismatch => !!mismatch.hdcedFourPlusDate)
      .sort((a, b) => {
        if (a.establishment != null && b.establishment != null) {
          const establishmentComparison = a.establishment.localeCompare(b.establishment)
          if (establishmentComparison) {
            return establishmentComparison
          }
        }
        const dateA = Date.parse(a.hdcedFourPlusDate)
        const dateB = Date.parse(b.hdcedFourPlusDate)
        return dateA.valueOf() - dateB.valueOf()
      })
  }

  private createRow(mismatch: HdcFourPlusComparisonMismatch, prison: string) {
    return [
      { text: mismatch.personId },
      { text: mismatch.lastName },
      this.isAllPrisons(prison) ? { text: mismatch.establishment } : undefined,
      { text: this.formatDate(mismatch.hdcedFourPlusDate) },
      mismatch.releaseDate
        ? { text: `${this.formatDate(mismatch.releaseDate.date)} (${mismatch.releaseDate.type})` }
        : { text: '' },
    ].filter(e => e)
  }

  private isAllPrisons(prison: string) {
    return prison === 'all'
  }

  private formatDate(date: string) {
    return date ? DateTime.fromISO(date).toFormat('dd-MM-yyyy') : ''
  }
}
