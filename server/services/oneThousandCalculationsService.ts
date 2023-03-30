import dayjs from 'dayjs'
import _ from 'lodash'
import {
  BookingCalculation,
  CalculationBreakdown,
  CalculationUserQuestions,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiOffenderCalculatedKeyDates,
  PrisonApiOffenderFinePayment,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'
import OneThousandCalculationsRow from '../models/OneThousandCalculationsRow'
import SentenceTypes from '../models/SentenceTypes'
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
    // This temporary code and test aid has become a permanent fixture! TODO refactor to coding standards
    for (const nomsId of nomsIds) {
      let prisonDetails,
        bookingId,
        nomisDates,
        sentenceAndOffences,
        adjustments,
        returnToCustody,
        keyDates,
        finePayments,
        questions,
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
        returnToCustody = sentenceAndOffences.filter(s => SentenceTypes.isSentenceFixedTermRecall(s)).length
          ? await this.prisonerService.getReturnToCustodyDate(bookingId, token)
          : null
        finePayments = sentenceAndOffences.filter(s => SentenceTypes.isSentenceAfine(s)).length
          ? await this.prisonerService.getOffenderFinePayments(bookingId, token)
          : null
        questions = sentenceAndOffences.filter(s => SentenceTypes.isSentenceSds(s)).length
          ? await this.calculateReleaseDatesService.getCalculationUserQuestions(nomsId, token)
          : null
        try {
          const { calculatedReleaseDates: calc, validationMessages } =
            await this.calculateReleaseDatesService.calculateTestReleaseDates(
              username,
              nomsId,
              {
                calculateErsed: keyDates.earlyRemovalSchemeEligibilityDate != null,
                useOffenceIndicators: true,
                sentenceCalculationUserInputs: [],
              },
              token
            )
          if (validationMessages.length > 0) {
            const message = validationMessages
              .map(i => i.message)
              .reduce((prev, current) => prev + current + '\r\n', '')
            csvData.push(
              this.addRow(
                nomsId,
                prisonDetails,
                calc,
                nomisDates,
                sentenceAndOffences,
                adjustments,
                returnToCustody,
                finePayments,
                questions,
                keyDates,
                breakdown,
                { message },
                'Validation Error'
              )
            )
            continue
          }
          try {
            //For now only fetch breakdown if we calculate a PED or HDCED. We may want to capture the breakdown for more calculations later.
            if (calc.dates.PED || calc.dates.HDCED) {
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
              finePayments,
              questions,
              keyDates,
              breakdown
            )
          )
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
              finePayments,
              questions,
              keyDates,
              breakdown,
              ex,
              'Server error'
            )
          )
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
            finePayments,
            questions,
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
    finePayments: PrisonApiOffenderFinePayment[],
    questions: CalculationUserQuestions,
    keyDates: PrisonApiOffenderCalculatedKeyDates,
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
      CRD_MATCH: errorText
        ? ''
        : OneThousandCalculationsService.areSame(nomisDates?.conditionalReleaseDate, calc?.dates.CRD),
      LED: errorText || calc?.dates.LED || calc?.dates?.SLED,
      NOMIS_LED: nomisDates?.licenceExpiryDate,
      NOMIS_LED_CALCULATED: nomisDates?.licenceExpiryCalculatedDate,
      NOMIS_LED_OVERRIDE: nomisDates?.licenceExpiryOverrideDate,
      LED_MATCH: errorText
        ? ''
        : OneThousandCalculationsService.areSame(nomisDates?.licenceExpiryDate, calc?.dates.LED || calc?.dates?.SLED),
      SED: errorText || calc?.dates?.SED || calc?.dates?.SLED,
      NOMIS_SED: nomisDates?.sentenceExpiryDate,
      NOMIS_SED_CALCULATED: nomisDates?.sentenceExpiryCalculatedDate,
      NOMIS_SED_OVERRIDE: nomisDates?.sentenceExpiryOverrideDate,
      SED_MATCH: errorText
        ? ''
        : OneThousandCalculationsService.areSame(nomisDates?.sentenceExpiryDate, calc?.dates?.SED || calc?.dates?.SLED),
      NPD: errorText || calc?.dates?.NPD,
      NOMIS_NPD: nomisDates?.nonParoleDate,
      NOMIS_NPD_OVERRIDE: nomisDates?.nonParoleOverrideDate,
      NPD_MATCH: errorText ? '' : OneThousandCalculationsService.areSame(nomisDates?.nonParoleDate, calc?.dates?.NPD),
      ARD: errorText || calc?.dates?.ARD,
      NOMIS_ARD: nomisDates?.automaticReleaseDate,
      NOMIS_ARD_OVERRIDE: nomisDates?.automaticReleaseOverrideDate,
      ARD_MATCH: errorText
        ? ''
        : OneThousandCalculationsService.areSame(nomisDates?.automaticReleaseDate, calc?.dates?.ARD),
      TUSED: errorText || calc?.dates?.TUSED,
      NOMIS_TUSED: nomisDates?.topupSupervisionExpiryDate,
      NOMIS_TUSED_CALCULATED: nomisDates?.topupSupervisionExpiryCalculatedDate,
      NOMIS_TUSED_OVERRIDE: nomisDates?.topupSupervisionExpiryOverrideDate,
      TUSED_MATCH: errorText
        ? ''
        : OneThousandCalculationsService.areSame(nomisDates?.topupSupervisionExpiryDate, calc?.dates?.TUSED),
      PED: errorText || calc?.dates?.PED,
      NOMIS_PED: nomisDates?.paroleEligibilityDate,
      NOMIS_PED_CALCULATED: nomisDates?.paroleEligibilityCalculatedDate,
      NOMIS_PED_OVERRIDE: nomisDates?.paroleEligibilityOverrideDate,
      PED_MATCH: errorText
        ? ''
        : OneThousandCalculationsService.areSame(nomisDates?.paroleEligibilityDate, calc?.dates?.PED),
      HDCED: errorText || calc?.dates?.HDCED,
      NOMIS_HDCED: nomisDates?.homeDetentionCurfewEligibilityDate,
      NOMIS_HDCED_CALCULATED: nomisDates?.homeDetentionCurfewEligibilityCalculatedDate,
      NOMIS_HDCED_OVERRIDE: nomisDates?.homeDetentionCurfewEligibilityOverrideDate,
      HDCED_MATCH: errorText
        ? ''
        : OneThousandCalculationsService.areSame(nomisDates?.homeDetentionCurfewEligibilityDate, calc?.dates?.HDCED),
      ETD: errorText || calc?.dates?.ETD,
      NOMIS_ETD: nomisDates?.earlyTermDate,
      NOMIS_ETD_CALCULATED: nomisDates?.etdCalculatedDate,
      NOMIS_ETD_OVERRIDE: nomisDates?.etdOverrideDate,
      ETD_MATCH: errorText ? '' : OneThousandCalculationsService.areSame(nomisDates?.earlyTermDate, calc?.dates?.ETD),
      MTD: errorText || calc?.dates?.MTD,
      NOMIS_MTD: nomisDates?.midTermDate,
      NOMIS_MTD_CALCULATED: nomisDates?.mtdCalculatedDate,
      NOMIS_MTD_OVERRIDE: nomisDates?.mtdOverrideDate,
      MTD_MATCH: errorText ? '' : OneThousandCalculationsService.areSame(nomisDates?.midTermDate, calc?.dates?.MTD),
      LTD: errorText || calc?.dates?.LTD,
      NOMIS_LTD: nomisDates?.lateTermDate,
      NOMIS_LTD_CALCULATED: nomisDates?.ltdCalculatedDate,
      NOMIS_LTD_OVERRIDE: nomisDates?.ltdOverrideDate,
      LTD_MATCH: errorText ? '' : OneThousandCalculationsService.areSame(nomisDates?.lateTermDate, calc?.dates?.LTD),
      DPRRD: errorText || calc?.dates?.DPRRD,
      NOMIS_DPRRD: nomisDates?.dtoPostRecallReleaseDate,
      NOMIS_DPRRD_OVERRIDE: nomisDates?.dtoPostRecallReleaseDateOverride,
      DPRRD_MATCH: errorText
        ? ''
        : OneThousandCalculationsService.areSame(nomisDates?.dtoPostRecallReleaseDate, calc?.dates?.PRRD),
      PRRD: errorText || calc?.dates?.PRRD,
      NOMIS_PRRD: nomisDates?.postRecallReleaseDate,
      NOMIS_PRRD_OVERRIDE: nomisDates?.postRecallReleaseOverrideDate,
      PRRD_MATCH: errorText
        ? ''
        : OneThousandCalculationsService.areSame(nomisDates?.postRecallReleaseDate, calc?.dates?.PRRD),
      ESED: errorText || calc?.dates?.ESED,
      NOMIS_ESED: nomisDates?.effectiveSentenceEndDate,
      ERSED: errorText || calc?.dates?.ERSED,
      NOMIS_ERSED: keyDates?.earlyRemovalSchemeEligibilityDate,
      ERSED_MATCH: errorText
        ? ''
        : OneThousandCalculationsService.areSame(nomisDates?.earlyRemovalSchemeEligibilityDate, calc?.dates?.ERSED),
      NOMIS_ROTL: keyDates?.releaseOnTemporaryLicenceDate,
      COMMENT: keyDates?.comment,
      REASON_CODE: keyDates?.reasonCode,
      SENTENCE_LENGTH: sentenceLength,
      NOMIS_ESL: keyDates?.sentenceLength,
      NOMIS_JSL: keyDates?.judiciallyImposedSentenceLength,
    }
    return {
      ...row,
      IS_ESL_SAME: sentenceLength === keyDates?.sentenceLength ? 'Y' : 'N',
      IS_JSL_SAME: sentenceLength === keyDates?.judiciallyImposedSentenceLength ? 'Y' : 'N',
      IS_PED_ADJUSTED_TO_CRD: this.isPedAdjustedToCrd(breakdown, calc),
      IS_HDCED_14_DAY_RULE: this.isHdced14DayRule(breakdown, calc),
      HAS_SDS_PLUS_PCSC: this.hasPcscSdsPlus(questions),
      SEX_OFFENDER: this.isSexOffender(prisoner),
      LOCATION: prisoner?.locationDescription,
      SENTENCES: JSON.stringify(sentenceAndOffences),
      ADJUSTMENTS: JSON.stringify(adjustments),
      RETURN_TO_CUSTODY: JSON.stringify(returnToCustody),
      FINE_PAYMENTS: JSON.stringify(finePayments),
      CONSECUTIVE_SENTENCES: sentenceAndOffences ? this.getConsecutiveSentences(sentenceAndOffences) : '',
      ERROR_TEXT: ex?.message,
      ERROR_JSON: JSON.stringify(ex),
    }
  }

  isPedAdjustedToCrd(breakdown: CalculationBreakdown, calc: BookingCalculation): 'Y' | 'N' | '' {
    if (calc?.dates.PED) {
      if (
        breakdown?.breakdownByReleaseDateType?.PED?.rules?.includes('PED_EQUAL_TO_LATEST_NON_PED_ACTUAL_RELEASE') ||
        breakdown?.breakdownByReleaseDateType?.PED?.rules?.includes('PED_EQUAL_TO_LATEST_NON_PED_CONDITIONAL_RELEASE')
      ) {
        return 'Y'
      } else {
        return 'N'
      }
    }
    return ''
  }

  isHdced14DayRule(breakdown: CalculationBreakdown, calc: BookingCalculation): 'Y' | 'N' | '' {
    if (calc?.dates.HDCED) {
      return breakdown?.breakdownByReleaseDateType?.HDCED?.rules?.includes('HDCED_MINIMUM_CUSTODIAL_PERIOD') ? 'Y' : 'N'
    }
    return ''
  }

  hasPcscSdsPlus(questions: CalculationUserQuestions): 'Y' | 'N' | '' {
    if (questions) {
      return questions.sentenceQuestions ? 'Y' : 'N'
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

  private static areSame = (nomisDate: string, calculatedDate: string): 'Y' | 'N' => {
    if (!nomisDate && !calculatedDate) return 'Y'
    if (!nomisDate && calculatedDate) return 'N'
    if (nomisDate && !calculatedDate) return 'N'
    return nomisDate === calculatedDate ? 'Y' : 'N'
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
