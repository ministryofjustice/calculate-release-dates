import { ComparisonPersonOverview } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class ComparisonResultMismatchDetailModel {
  nomisReference: string

  bookingId: number

  calculatedAt: string

  dates: Array<Array<{ text: string }>>

  constructor(comparisonPerson: ComparisonPersonOverview) {
    this.nomisReference = comparisonPerson.personId
    this.bookingId = comparisonPerson.bookingId
    this.calculatedAt = comparisonPerson.calculatedAt
    this.dates = [
      this.createDateRow('SED', comparisonPerson.crdsDates, comparisonPerson.nomisDates, 'SLED'),
      this.createDateRow('ARD', comparisonPerson.crdsDates, comparisonPerson.nomisDates),
      this.createDateRow('CRD', comparisonPerson.crdsDates, comparisonPerson.nomisDates),
      this.createDateRow('NPD', comparisonPerson.crdsDates, comparisonPerson.nomisDates),
      this.createDateRow('PRRD', comparisonPerson.crdsDates, comparisonPerson.nomisDates),
      this.createDateRow('LED', comparisonPerson.crdsDates, comparisonPerson.nomisDates, 'SLED'),
      this.createDateRow('HDCED', comparisonPerson.crdsDates, comparisonPerson.nomisDates),
      this.createDateRow('PED', comparisonPerson.crdsDates, comparisonPerson.nomisDates),
      this.createDateRow('HDCAD', comparisonPerson.crdsDates, comparisonPerson.nomisDates),
      this.createDateRow('APD', comparisonPerson.crdsDates, comparisonPerson.nomisDates),
      this.createDateRow('ROTL', comparisonPerson.crdsDates, comparisonPerson.nomisDates),
      this.createDateRow('ERSED', comparisonPerson.crdsDates, comparisonPerson.nomisDates),
      this.createDateRow('ETD', comparisonPerson.crdsDates, comparisonPerson.nomisDates),
      this.createDateRow('MTD', comparisonPerson.crdsDates, comparisonPerson.nomisDates),
      this.createDateRow('LTD', comparisonPerson.crdsDates, comparisonPerson.nomisDates),
      this.createDateRow('TUSED', comparisonPerson.crdsDates, comparisonPerson.nomisDates),
      this.createDateRow('Tariff', comparisonPerson.crdsDates, comparisonPerson.nomisDates),
      this.createDateRow('DPRRD', comparisonPerson.crdsDates, comparisonPerson.nomisDates),
      this.createDateRow('TERSED', comparisonPerson.crdsDates, comparisonPerson.nomisDates),
      this.createDateRow('ESED', comparisonPerson.crdsDates, comparisonPerson.nomisDates),
    ].filter(row => row)
  }

  private createDateRow(
    key: string,
    crdsDates: {
      [key: string]: string
    },
    nomisDates: {
      [key: string]: string
    },
    crdsDateKey = ''
  ): Array<{ text: string }> | undefined {
    if (crdsDates[crdsDateKey] || crdsDates[key] || nomisDates[key]) {
      return [{ text: key }, { text: crdsDates[crdsDateKey] ?? crdsDates[key] ?? '' }, { text: nomisDates[key] ?? '' }]
    }
    return undefined
  }
}
