import { DateTime } from 'luxon'
import {
  ComparisonPersonOverview,
  ReleaseDateCalculationBreakdown,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class ComparisonResultMismatchDetailModel {
  nomisReference: string

  lastName: string

  bookingId: number

  calculatedAt: string

  dates: ({ text: string } | { html: string })[][]

  hdced14DayRuleApplied: string

  activeSexOffender?: string

  sdsPlusOffences?: string

  mismatchType: string

  constructor(comparisonPerson: ComparisonPersonOverview) {
    this.nomisReference = comparisonPerson.personId
    this.lastName = comparisonPerson.lastName
    this.bookingId = comparisonPerson.bookingId
    this.calculatedAt = comparisonPerson.calculatedAt
    this.hdced14DayRuleApplied = this.isHdced14DayRule(
      comparisonPerson.crdsDates,
      comparisonPerson.breakdownByReleaseDateType,
    )
    this.activeSexOffender = this.isActiveSexOffender(comparisonPerson)

    this.sdsPlusOffences = this.getSdsSentenceCaseAndCount(comparisonPerson)

    this.mismatchType = comparisonPerson.mismatchType

    this.dates = [
      this.createDateRow(
        'SED',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
        'SLED',
      ),
      this.createDateRow(
        'ARD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
      ),
      this.createDateRow(
        'CRD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
      ),
      this.createDateRow(
        'NPD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
      ),
      this.createDateRow(
        'PRRD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
      ),
      this.createDateRow(
        'LED',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
        'SLED',
      ),
      this.createDateRow(
        'HDCED4PLUS',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
      ),
      this.createDateRow(
        'HDCED',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
      ),
      this.createDateRow(
        'PED',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
      ),
      this.createDateRow(
        'HDCAD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
      ),
      this.createDateRow(
        'APD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
      ),
      this.createDateRow(
        'ROTL',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
      ),
      this.createDateRow(
        'ERSED',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
      ),
      this.createDateRow(
        'ETD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
      ),
      this.createDateRow(
        'MTD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
      ),
      this.createDateRow(
        'LTD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
      ),
      this.createDateRow(
        'TUSED',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
      ),
      this.createDateRow(
        'Tariff',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
      ),
      this.createDateRow(
        'DPRRD',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
      ),
      this.createDateRow(
        'TERSED',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
      ),
      this.createDateRow(
        'ESED',
        comparisonPerson.crdsDates,
        comparisonPerson.nomisDates,
        comparisonPerson.overrideDates,
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
    crdsDateKey: string = '',
  ): ({ text: string } | { html: string })[] {
    if (crdsDates[crdsDateKey] || crdsDates[key] || nomisDates[key] || overrideDates[key]) {
      const dateRow: ({ text: string } | { html: string })[] = [{ text: key }]
      if (this.mismatchType !== 'VALIDATION_ERROR') {
        dateRow.push({
          html: this.displayMismatchLabel(
            key,
            this.formatDate(crdsDates[crdsDateKey] ?? crdsDates[key]),
            this.formatDate(nomisDates[key]),
            this.formatDate(overrideDates[key]),
          ),
        })
      }
      dateRow.push(
        { text: this.formatDate(crdsDates[crdsDateKey] ?? crdsDates[key]) },
        { text: this.formatDate(nomisDates[key]) },
        { text: this.formatDate(overrideDates[key]) },
      )
      return dateRow
    }

    return undefined
  }

  private displayMismatchLabel(key: string, crdsDate: string, nomisDate: string, overrideDate: string) {
    const datesNotApplicableForMatch = ['HDCAD', 'APD', 'ROTL', 'ESED']
    if (datesNotApplicableForMatch.includes(key)) {
      return this.notApplicableLabel()
    }
    if (crdsDate === overrideDate) {
      return this.matchLabel()
    }
    if (overrideDate === '' && crdsDate === nomisDate) {
      return this.matchLabel()
    }
    return this.mismatchLabel()
  }

  private formatDate(date: string) {
    return date ? DateTime.fromISO(date).toFormat('dd-MM-yyyy') : ''
  }

  private matchLabel() {
    return '<strong class="govuk-tag govuk-tag--blue"> Match </strong>'
  }

  private mismatchLabel() {
    return '<strong class="govuk-tag govuk-tag--red"> Mismatch </strong>'
  }

  private notApplicableLabel() {
    return '<strong class="govuk-tag govuk-tag--grey"> Not Applicable </strong>'
  }

  private isHdced14DayRule(
    crdsDates: { [key: string]: string },
    breakdown: { [key: string]: ReleaseDateCalculationBreakdown },
  ): string {
    if (crdsDates.HDCED) {
      return breakdown?.HDCED?.rules?.includes('HDCED_MINIMUM_CUSTODIAL_PERIOD') ? 'Yes' : 'No'
    }
    return 'N/A'
  }

  private isActiveSexOffender(comparisonPerson: ComparisonPersonOverview) {
    if (comparisonPerson.isActiveSexOffender === null) {
      return null
    }

    return comparisonPerson.isActiveSexOffender ? 'Yes' : 'No'
  }

  private getSdsSentenceCaseAndCount(comparisonPerson: ComparisonPersonOverview) {
    let sdsCaseAndCountText = ''
    if (comparisonPerson.sdsSentencesIdentified !== null) {
      const caseAndCountList: string[] = []
      comparisonPerson.sdsSentencesIdentified.forEach(sdsSentence => {
        caseAndCountList.push(`Court case ${sdsSentence.caseSequence}, count ${sdsSentence.lineSequence}`)
      })
      sdsCaseAndCountText = caseAndCountList.join('</br>')
    }
    return sdsCaseAndCountText
  }
}
