import dayjs from 'dayjs'
import _ from 'lodash'
import {
  BookingCalculation,
  CalculationBreakdown,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonApiOffenderKeyDates } from '../@types/prisonApi/PrisonApiOffenderKeyDates'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/PrisonApiOffenderSentenceAndOffences'
import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'
import OneThousandCalculationsRow from '../models/OneThousandCalculationsRow'
import SentenceRowViewModel from '../models/SentenceRowViewModel'
import { indexBy } from '../utils/utils'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import PrisonerService from './prisonerService'

export default class OneThousandCalculationsService {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService
  ) {}
  /* eslint-disable */
  public async runCalculations(
    username: string,
    caseloads: string[],
    token: string,
    nomsIds: string[]
  ): Promise<OneThousandCalculationsRow[]> {
    const csvData: OneThousandCalculationsRow[] = []

    // This is just temporary code therefore the iterative loop rather than an async approach (was easier to develop and easier to debug)
    for (const nomsId of nomsIds) {
      let prisonDetails,
        bookingId,
        nomisDates,
        sentenceAndOffences,
        adjustments,
        returnToCustody,
        keyDates,
        calc,
        breakdown
      try {
        prisonDetails = await this.prisonerService.getPrisonerDetailIncludingReleased(
          username,
          nomsId,
          caseloads,
          token
        )
        bookingId = prisonDetails.bookingId
        nomisDates = await this.prisonerService.getSentenceDetail(username, bookingId, token)
        keyDates = await this.prisonerService.getOffenderKeyDates(bookingId, token)
        sentenceAndOffences = await this.prisonerService.getSentencesAndOffences(username, bookingId, token)
        adjustments = await this.prisonerService.getBookingAndSentenceAdjustments(bookingId, token)
        returnToCustody = sentenceAndOffences.filter(s => SentenceRowViewModel.isSentenceFixedTermRecall(s)).length
          ? await this.prisonerService.getReturnToCustodyDate(bookingId, token)
          : null
        try {
          calc = await this.calculateReleaseDatesService.calculateTestReleaseDates(username, nomsId, null, token)
          try {
            //For now only fetch breakdown if we calculate a PED. We may want to capture the breakdown for more calculations later.
            if (calc.dates.PED) {
              breakdown = await this.calculateReleaseDatesService.getCalculationBreakdown(
                calc.calculationRequestId,
                token
              )
            }
          } catch (ex) {}
          csvData.push(
            this.addRow(
              nomsId,
              prisonDetails,
              calc,
              nomisDates,
              sentenceAndOffences,
              adjustments,
              returnToCustody,
              keyDates,
              breakdown
            )
          )
        } catch (ex) {
          if (ex?.status === 422) {
            csvData.push(
              this.addRow(
                nomsId,
                prisonDetails,
                calc,
                nomisDates,
                sentenceAndOffences,
                adjustments,
                returnToCustody,
                keyDates,
                breakdown,
                ex,
                'Validation Error'
              )
            )
          } else {
            csvData.push(
              this.addRow(
                nomsId,
                prisonDetails,
                calc,
                nomisDates,
                sentenceAndOffences,
                adjustments,
                returnToCustody,
                keyDates,
                breakdown,
                ex,
                'Server error'
              )
            )
          }
        }
      } catch (ex) {
        csvData.push(
          this.addRow(
            nomsId,
            prisonDetails,
            calc,
            nomisDates,
            sentenceAndOffences,
            adjustments,
            returnToCustody,
            keyDates,
            breakdown,
            ex,
            'Prison API Error'
          )
        )
      }
    }
    return csvData
  }

  private addRow(
    nomsId: string,
    prisoner: PrisonApiPrisoner,
    calc: BookingCalculation,
    nomisDates: PrisonApiSentenceDetail,
    sentenceAndOffences: PrisonApiOffenderSentenceAndOffences[],
    adjustments: PrisonApiBookingAndSentenceAdjustments,
    returnToCustody: PrisonApiReturnToCustodyDate,
    keyDates: PrisonApiOffenderKeyDates,
    breakdown: CalculationBreakdown,
    ex?: any,
    errorText?: string
  ): OneThousandCalculationsRow {
    const sentenceLength = calc ? OneThousandCalculationsService.sentenceLength(calc) : ''
    const row = {
      NOMS_ID: nomsId,
      DOB: prisoner?.dateOfBirth,
      REQUEST_ID: calc?.calculationRequestId,
      CALCULATED_DATES: JSON.stringify(calc?.dates),
      CRD: errorText || calc?.dates.CRD,
      NOMIS_CRD: nomisDates?.conditionalReleaseDate,
      NOMIS_CRD_OVERRIDE: nomisDates?.conditionalReleaseOverrideDate,
      LED: errorText || calc?.dates.LED || calc?.dates?.SLED,
      NOMIS_LED: nomisDates?.licenceExpiryDate,
      NOMIS_LED_CALCULATED: nomisDates?.licenseExpiryCalculatedDate,
      NOMIS_LED_OVERRIDE: nomisDates?.licenseExpiryOverrideDate,
      SED: errorText || calc?.dates?.SED || calc?.dates?.SLED,
      NOMIS_SED: nomisDates?.sentenceExpiryDate,
      NOMIS_SED_CALCULATED: nomisDates?.sentenceExpiryCalculatedDate,
      NOMIS_SED_OVERRIDE: nomisDates?.sentenceExpiryOverrideDate,
      NPD: errorText || calc?.dates?.NPD,
      NOMIS_NPD: nomisDates?.nonParoleDate,
      NOMIS_NPD_OVERRIDE: nomisDates?.nonParoleOverrideDate,
      ARD: errorText || calc?.dates?.ARD,
      NOMIS_ARD: nomisDates?.automaticReleaseDate,
      NOMIS_ARD_OVERRIDE: nomisDates?.automaticReleaseOverrideDate,
      TUSED: errorText || calc?.dates?.TUSED,
      NOMIS_TUSED: nomisDates?.topupSupervisionExpiryDate,
      PED: errorText || calc?.dates?.PED,
      NOMIS_PED: nomisDates?.paroleEligibilityDate,
      NOMIS_PED_CALCULATED: nomisDates?.paroleEligibilityCalculatedDate,
      NOMIS_PED_OVERRIDE: nomisDates?.paroleEligibilityOverrideDate,
      HDCED: errorText || calc?.dates?.HDCED,
      NOMIS_HDCED: nomisDates?.homeDetentionCurfewEligibilityDate,
      ETD: errorText || calc?.dates?.ETD,
      NOMIS_ETD: nomisDates?.earlyTermDate,
      MTD: errorText || calc?.dates?.MTD,
      NOMIS_MTD: nomisDates?.midTermDate,
      LTD: errorText || calc?.dates?.LTD,
      NOMIS_LTD: nomisDates?.lateTermDate,
      DPRRD: errorText || calc?.dates?.DPRRD,
      NOMIS_DPRRD: nomisDates?.dtoPostRecallReleaseDate,
      NOMIS_DPRRD_OVERRIDE: nomisDates?.dtoPostRecallReleaseDateOverride,
      PRRD: errorText || calc?.dates?.PRRD,
      NOMIS_PRRD: nomisDates?.postRecallReleaseDate,
      NOMIS_PRRD_OVERRIDE: nomisDates?.postRecallReleaseOverrideDate,
      ESED: errorText || calc?.dates?.ESED,
      NOMIS_ESED: nomisDates?.effectiveSentenceEndDate,
      SENTENCE_LENGTH: sentenceLength,
      NOMIS_ESL: keyDates?.sentenceLength,
      NOMIS_JSL: keyDates?.judiciallyImposedSentenceLength,
    }
    return {
      ...row,
      ARE_DATES_SAME: OneThousandCalculationsService.areDatesSame(row) ? 'Y' : 'N',
      ARE_DATES_SAME_USING_OVERRIDES: OneThousandCalculationsService.areDatesSameUsingOverrides(row) ? 'Y' : 'N',
      IS_ESL_SAME: sentenceLength === keyDates?.sentenceLength ? 'Y' : 'N',
      IS_JSL_SAME: sentenceLength === keyDates?.judiciallyImposedSentenceLength ? 'Y' : 'N',
      IS_PED_ADJUSTED_TO_CRD: this.isPedAdjustedToCrd(breakdown, calc),
      SEX_OFFENDER: this.isSexOffender(prisoner),
      LOCATION: prisoner?.locationDescription,
      SENTENCES: JSON.stringify(sentenceAndOffences),
      ADJUSTMENTS: JSON.stringify(adjustments),
      RETURN_TO_CUSTODY: JSON.stringify(returnToCustody),
      CONSECUTIVE_SENTENCES: sentenceAndOffences ? this.getConsecutiveSentences(sentenceAndOffences) : '',
      ERROR_TEXT: ex?.message,
      ERROR_JSON: JSON.stringify(ex),
    }
  }

  isPedAdjustedToCrd(breakdown: CalculationBreakdown, calc: BookingCalculation): 'Y' | 'N' | '' {
    if (calc?.dates.PED) {
      if (breakdown?.breakdownByReleaseDateType?.PED?.rules?.includes('PED_EQUAL_TO_LATEST_NON_PED_RELEASE')) {
        return 'Y'
      } else {
        return 'N'
      }
    }
    return ''
  }

  private isSexOffender(prisoner: PrisonApiPrisoner): 'Y' | 'N' {
    return !!prisoner?.alerts?.find(alert => {
      const dateCreated = dayjs(alert.dateCreated)
      const now = dayjs()
      return (
        dateCreated < now &&
        (!alert.dateExpires || dayjs(alert.dateExpires) > now) &&
        alert.alertType === 'S' &&
        alert.alertCode === 'SOR'
      )
    })
      ? 'Y'
      : 'N'
  }

  private static sentenceLength = (calc: BookingCalculation) => {
    const sentenceLength: string = calc.effectiveSentenceLength as string
    if (!sentenceLength) {
      return 'Unknown'
    }
    let years = 0,
      months = 0,
      days = 0
    let workingLength = sentenceLength.substring(1)

    const yearsSplit = workingLength.split('Y')
    const hasYears = yearsSplit.length > 1
    if (hasYears) {
      years = +yearsSplit[0]
      workingLength = yearsSplit[1]
    }

    const monthsSplit = workingLength.split('M')
    const hasMonths = monthsSplit.length > 1
    if (hasMonths) {
      months = +monthsSplit[0]
      workingLength = monthsSplit[1]
    }

    const daysSplit = workingLength.split('D')
    const hasDays = daysSplit.length > 1
    if (hasDays) {
      days = +daysSplit[0]
      workingLength = daysSplit[1]
    }
    return `${String(years).padStart(2, '0')}/${String(months).padStart(2, '0')}/${String(days).padStart(2, '0')}`
  }

  private static areSame = (nomisDate: string, calculatedDate: string) => {
    if (!nomisDate && !calculatedDate) return true
    if (!nomisDate && calculatedDate) return false
    if (nomisDate && !calculatedDate) return false
    return nomisDate === calculatedDate
  }

  private static areDatesSameUsingOverrides(row: any) {
    return (
      OneThousandCalculationsService.areSame(row.CRD, row.NOMIS_CRD_OVERRIDE) &&
      OneThousandCalculationsService.areSame(row.SED, row.NOMIS_SED_OVERRIDE) &&
      OneThousandCalculationsService.areSame(row.LED, row.NOMIS_LED_OVERRIDE) &&
      OneThousandCalculationsService.areSame(row.NPD, row.NOMIS_NPD_OVERRIDE) &&
      OneThousandCalculationsService.areSame(row.ARD, row.NOMIS_ARD_OVERRIDE) &&
      OneThousandCalculationsService.areSame(row.TUSED, row.NOMIS_TUSED) &&
      OneThousandCalculationsService.areSame(row.PED, row.NOMIS_PED_OVERRIDE) &&
      OneThousandCalculationsService.areSame(row.HDCED, row.NOMIS_HDCED) &&
      OneThousandCalculationsService.areSame(row.ETD, row.NOMIS_ETD) &&
      OneThousandCalculationsService.areSame(row.MTD, row.NOMIS_MTD) &&
      OneThousandCalculationsService.areSame(row.LTD, row.NOMIS_LTD) &&
      OneThousandCalculationsService.areSame(row.DPRRD, row.NOMIS_DPRRD_OVERRIDE) &&
      OneThousandCalculationsService.areSame(row.PRRD, row.NOMIS_PRRD_OVERRIDE) &&
      OneThousandCalculationsService.areSame(row.ESED, row.NOMIS_ESED)
    )
  }
  private static areDatesSame(row: any) {
    return (
      OneThousandCalculationsService.areSame(row.CRD, row.NOMIS_CRD) &&
      OneThousandCalculationsService.areSame(row.SED, row.NOMIS_SED) &&
      OneThousandCalculationsService.areSame(row.LED, row.NOMIS_LED) &&
      OneThousandCalculationsService.areSame(row.NPD, row.NOMIS_NPD) &&
      OneThousandCalculationsService.areSame(row.ARD, row.NOMIS_ARD) &&
      OneThousandCalculationsService.areSame(row.TUSED, row.NOMIS_TUSED) &&
      OneThousandCalculationsService.areSame(row.PED, row.NOMIS_PED) &&
      OneThousandCalculationsService.areSame(row.HDCED, row.NOMIS_HDCED) &&
      OneThousandCalculationsService.areSame(row.ETD, row.NOMIS_ETD) &&
      OneThousandCalculationsService.areSame(row.MTD, row.NOMIS_MTD) &&
      OneThousandCalculationsService.areSame(row.LTD, row.NOMIS_LTD) &&
      OneThousandCalculationsService.areSame(row.DPRRD, row.NOMIS_DPRRD) &&
      OneThousandCalculationsService.areSame(row.PRRD, row.NOMIS_PRRD) &&
      OneThousandCalculationsService.areSame(row.ESED, row.NOMIS_ESED)
    )
  }

  private getConsecutiveSentences(sentenceAndOffences: PrisonApiOffenderSentenceAndOffences[]) {
    const sentenceSequenceToSentence = indexBy(
      sentenceAndOffences,
      (sent: PrisonApiOffenderSentenceAndOffences) => sent.sentenceSequence
    )
    const sentencesConsecutiveTo = sentenceAndOffences.filter(sentence => !!sentence.consecutiveToSequence)
    const sentencesConsectiveFrom = sentencesConsecutiveTo.map(sentence =>
      sentenceSequenceToSentence.get(sentence.consecutiveToSequence)
    )
    return JSON.stringify(
      _.union(sentencesConsecutiveTo, sentencesConsectiveFrom).sort((a, b) => a.lineSequence - b.lineSequence)
    )
  }
}
/* eslint-enable */
