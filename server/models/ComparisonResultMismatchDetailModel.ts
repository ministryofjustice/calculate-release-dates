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
      this.createDateRow(
        'SED',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
        'SLED'
      ),
      this.createDateRow(
        'ARD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates
      ),
      this.createDateRow(
        'CRD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates
      ),
      this.createDateRow(
        'NPD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates
      ),
      this.createDateRow(
        'PRRD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates
      ),
      this.createDateRow(
        'LED',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
        'SLED'
      ),
      this.createDateRow(
        'HDCED',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates
      ),
      this.createDateRow(
        'PED',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates
      ),
      this.createDateRow(
        'HDCAD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates
      ),
      this.createDateRow(
        'APD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates
      ),
      this.createDateRow(
        'ROTL',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates
      ),
      this.createDateRow(
        'ERSED',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates
      ),
      this.createDateRow(
        'ETD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates
      ),
      this.createDateRow(
        'MTD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates
      ),
      this.createDateRow(
        'LTD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates
      ),
      this.createDateRow(
        'TUSED',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates
      ),
      this.createDateRow(
        'Tariff',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates
      ),
      this.createDateRow(
        'DPRRD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates
      ),
      this.createDateRow(
        'TERSED',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates
      ),
      this.createDateRow(
        'ESED',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates
      ),
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
    overrideDates: {
      [key: string]: string
    },
    crdsDateKey: string = ''
  ): Array<{ text: string }> | undefined {
    if (crdsDates[crdsDateKey] || crdsDates[key] || nomisDates[key]) {
      return [
        { text: key },
        { text: crdsDates[crdsDateKey] ?? crdsDates[key] ?? '' },
        { text: nomisDates[key] ?? '' },
        { text: overrideDates[key] ?? '' },
      ]
    }
    return undefined
  }
}
