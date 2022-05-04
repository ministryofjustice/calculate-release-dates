import { RequestHandler } from 'express'
import path from 'path'
import { stringify } from 'csv-stringify'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import logger from '../../logger'
import { BookingCalculation } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/PrisonApiOffenderSentenceAndOffences'
import SentenceRowViewModel from '../models/SentenceRowViewModel'
import { PrisonApiOffenderKeyDates } from '../@types/prisonApi/PrisonApiOffenderKeyDates'

export default class OtherRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService
  ) {}

  // TODO Remove this submitTestCalculation method and associated code - only in place to aid bulk testing of the calculation algorithm
  /* eslint-disable */
  public submitTestCalculation: RequestHandler = async (req, res) => {
    const { username, caseloads, token } = res.locals.user
    const { prisonerIds } = req.body
    const nomsIds = prisonerIds.split(/\r?\n/)
    if (nomsIds.length > 500) return res.redirect(`/test/calculation`)

    const csvData = []

    // This is just temporary code therefore the iterative loop rather than an async approach (was easier to develop and easier to debug)
    for (const nomsId of nomsIds) {
      let prisonDetails, bookingId, nomisDates, sentenceAndOffences, adjustments, returnToCustody, keyDates
      try {
        prisonDetails = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
        bookingId = prisonDetails.bookingId
        nomisDates = await this.prisonerService.getSentenceDetail(username, bookingId, token)
        keyDates = await this.prisonerService.getOffenderKeyDates(bookingId, token)
        sentenceAndOffences = await this.prisonerService.getSentencesAndOffences(username, bookingId, token)
        adjustments = await this.prisonerService.getBookingAndSentenceAdjustments(bookingId, token)
        returnToCustody = sentenceAndOffences.filter(s => SentenceRowViewModel.isSentenceFixedTermRecall(s)).length
          ? await this.prisonerService.getReturnToCustodyDate(bookingId, token)
          : null
        try {
          const calc = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(username, nomsId, token)
          csvData.push(
            this.addRow(prisonDetails, calc, nomisDates, sentenceAndOffences, adjustments, returnToCustody, keyDates)
          )
        } catch (ex) {
          if (ex?.status === 422) {
            csvData.push(
              this.addErrorRow(
                nomsId,
                prisonDetails,
                nomisDates,
                sentenceAndOffences,
                adjustments,
                returnToCustody,
                keyDates,
                ex,
                'Validation Error'
              )
            )
          } else {
            csvData.push(
              this.addErrorRow(
                nomsId,
                prisonDetails,
                nomisDates,
                sentenceAndOffences,
                adjustments,
                returnToCustody,
                keyDates,
                ex,
                'Server error'
              )
            )
          }
        }
      } catch (ex) {
        csvData.push(
          this.addErrorRow(
            nomsId,
            prisonDetails,
            nomisDates,
            sentenceAndOffences,
            adjustments,
            returnToCustody,
            keyDates,
            ex,
            'Prison API Error'
          )
        )
      }
    }

    const fileName = `download-release-dates.csv`
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    stringify(csvData, { header: true }).pipe(res)
  }

  private addRow(
    prisoner: PrisonApiPrisoner,
    calc: BookingCalculation,
    nomisDates: PrisonApiSentenceDetail,
    sentenceAndOffences: PrisonApiOffenderSentenceAndOffences[],
    adjustments: PrisonApiBookingAndSentenceAdjustments,
    returnToCustody: PrisonApiReturnToCustodyDate,
    keyDates: PrisonApiOffenderKeyDates
  ) {
    const sentenceLength = OtherRoutes.sentenceLength(calc)
    const row = {
      NOMS_ID: prisoner.offenderNo,
      DOB: prisoner.dateOfBirth,
      REQUEST_ID: calc.calculationRequestId,
      CALCULATED_DATES: calc.dates,
      CRD: calc.dates.CRD,
      NOMIS_CRD: nomisDates.conditionalReleaseDate,
      NOMIS_CRD_OVERRIDE: nomisDates.conditionalReleaseOverrideDate,
      LED: calc.dates.LED || calc.dates.SLED,
      NOMIS_LED: nomisDates.licenceExpiryDate,
      SED: calc.dates.SED || calc.dates.SLED,
      NOMIS_SED: nomisDates.sentenceExpiryDate,
      NPD: calc.dates.NPD,
      NOMIS_NPD: nomisDates.nonParoleDate,
      NOMIS_NPD_OVERRIDE: nomisDates.nonParoleOverrideDate,
      ARD: calc.dates.ARD,
      NOMIS_ARD: nomisDates.automaticReleaseDate,
      NOMIS_ARD_OVERRIDE: nomisDates.automaticReleaseOverrideDate,
      TUSED: calc.dates.TUSED,
      NOMIS_TUSED: nomisDates.topupSupervisionExpiryDate,
      PED: calc.dates.PED,
      NOMIS_PED: nomisDates.paroleEligibilityDate,
      HDCED: calc.dates.HDCED,
      NOMIS_HDCED: nomisDates.homeDetentionCurfewEligibilityDate,
      ETD: calc.dates.ETD,
      NOMIS_ETD: nomisDates.earlyTermDate,
      MTD: calc.dates.MTD,
      NOMIS_MTD: nomisDates.midTermDate,
      LTD: calc.dates.LTD,
      NOMIS_LTD: nomisDates.lateTermDate,
      DPRRD: calc.dates.DPRRD,
      NOMIS_DPRRD: nomisDates.postRecallReleaseDate,
      NOMIS_DPRRD_OVERRIDE: nomisDates.dtoPostRecallReleaseDateOverride,
      PRRD: calc.dates.PRRD,
      NOMIS_PRRD: nomisDates.postRecallReleaseDate,
      NOMIS_PRRD_OVERRIDE: nomisDates.postRecallReleaseOverrideDate,
      ESED: calc.dates.ESED,
      NOMIS_ESED: nomisDates.effectiveSentenceEndDate,
      SENTENCE_LENGTH: sentenceLength,
      NOMIS_ESL: keyDates.sentenceLength,
      NOMIS_JSL: keyDates.judiciallyImposedSentenceLength,
    }
    return {
      ...row,
      ARE_DATES_SAME: OtherRoutes.areDatesSame(row) ? 'Y' : 'N',
      ARE_DATES_SAME_USING_OVERRIDES: OtherRoutes.areDatesSameUsingOverrides(row) ? 'Y' : 'N',
      IS_ESL_SAME: sentenceLength === keyDates.sentenceLength ? 'Y' : 'N',
      IS_JSL_SAME: sentenceLength === keyDates.judiciallyImposedSentenceLength ? 'Y' : 'N',
      SENTENCES: JSON.stringify(sentenceAndOffences),
      ADJUSTMENTS: JSON.stringify(adjustments),
      RETURN_TO_CUSTODY: JSON.stringify(returnToCustody),
      ERROR_TEXT: null as string,
      ERROR_JSON: null as string,
    }
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
      OtherRoutes.areSame(row.CRD, row.NOMIS_CRD_OVERRIDE) &&
      OtherRoutes.areSame(row.SED, row.NOMIS_SED) &&
      OtherRoutes.areSame(row.LED, row.NOMIS_LED) &&
      OtherRoutes.areSame(row.NPD, row.NOMIS_NPD_OVERRIDE) &&
      OtherRoutes.areSame(row.ARD, row.NOMIS_ARD_OVERRIDE) &&
      OtherRoutes.areSame(row.TUSED, row.NOMIS_TUSED) &&
      OtherRoutes.areSame(row.PED, row.NOMIS_PED) &&
      OtherRoutes.areSame(row.HDCED, row.NOMIS_HDCED) &&
      OtherRoutes.areSame(row.ETD, row.NOMIS_ETD) &&
      OtherRoutes.areSame(row.MTD, row.NOMIS_MTD) &&
      OtherRoutes.areSame(row.LTD, row.NOMIS_LTD) &&
      OtherRoutes.areSame(row.DPRRD, row.NOMIS_DPRRD_OVERRIDE) &&
      OtherRoutes.areSame(row.PRRD, row.NOMIS_PRRD_OVERRIDE) &&
      OtherRoutes.areSame(row.ESED, row.NOMIS_ESED)
    )
  }
  private static areDatesSame(row: any) {
    return (
      OtherRoutes.areSame(row.CRD, row.NOMIS_CRD) &&
      OtherRoutes.areSame(row.SED, row.NOMIS_SED) &&
      OtherRoutes.areSame(row.LED, row.NOMIS_LED) &&
      OtherRoutes.areSame(row.NPD, row.NOMIS_NPD) &&
      OtherRoutes.areSame(row.ARD, row.NOMIS_ARD) &&
      OtherRoutes.areSame(row.TUSED, row.NOMIS_TUSED) &&
      OtherRoutes.areSame(row.PED, row.NOMIS_PED) &&
      OtherRoutes.areSame(row.HDCED, row.NOMIS_HDCED) &&
      OtherRoutes.areSame(row.ETD, row.NOMIS_ETD) &&
      OtherRoutes.areSame(row.MTD, row.NOMIS_MTD) &&
      OtherRoutes.areSame(row.LTD, row.NOMIS_LTD) &&
      OtherRoutes.areSame(row.DPRRD, row.NOMIS_DPRRD) &&
      OtherRoutes.areSame(row.PRRD, row.NOMIS_PRRD) &&
      OtherRoutes.areSame(row.ESED, row.NOMIS_ESED)
    )
  }

  private addErrorRow(
    nomsId: string,
    prisoner: PrisonApiPrisoner,
    nomisDates: PrisonApiSentenceDetail,
    sentenceAndOffences: PrisonApiOffenderSentenceAndOffences[],
    adjustments: PrisonApiBookingAndSentenceAdjustments,
    returnToCustody: PrisonApiReturnToCustodyDate,
    keyDates: PrisonApiOffenderKeyDates,
    ex: any,
    errorText: string
  ) {
    return {
      NOMS_ID: nomsId,
      DOB: prisoner?.dateOfBirth,
      REQUEST_ID: errorText,
      CALCULATED_DATES: errorText,
      CRD: errorText,
      NOMIS_CRD: nomisDates?.conditionalReleaseDate,
      NOMIS_CRD_OVERRIDE: nomisDates?.nonParoleOverrideDate,
      LED: errorText,
      NOMIS_LED: nomisDates?.licenceExpiryDate,
      SED: errorText,
      NOMIS_SED: nomisDates?.sentenceExpiryDate,
      NPD: errorText,
      NOMIS_NPD: nomisDates?.nonParoleDate,
      NOMIS_NPD_OVERRIDE: nomisDates?.nonParoleOverrideDate,
      ARD: errorText,
      NOMIS_ARD: nomisDates?.automaticReleaseDate,
      NOMIS_ARD_OVERRIDE: nomisDates?.automaticReleaseOverrideDate,
      TUSED: errorText,
      NOMIS_TUSED: nomisDates?.topupSupervisionExpiryDate,
      PED: errorText,
      NOMIS_PED: nomisDates?.paroleEligibilityDate,
      HDCED: errorText,
      NOMIS_HDCED: nomisDates?.homeDetentionCurfewEligibilityDate,
      ETD: errorText,
      NOMIS_ETD: nomisDates?.earlyTermDate,
      MTD: errorText,
      NOMIS_MTD: nomisDates?.midTermDate,
      LTD: errorText,
      NOMIS_LTD: nomisDates?.lateTermDate,
      DPRRD: errorText,
      NOMIS_DPRRD: nomisDates?.postRecallReleaseDate,
      NOMIS_DPRRD_OVERRIDE: nomisDates?.dtoPostRecallReleaseDateOverride,
      PRRD: errorText,
      NOMIS_PRRD: nomisDates?.postRecallReleaseDate,
      NOMIS_PRRD_OVERRIDE: nomisDates?.postRecallReleaseOverrideDate,
      ESED: errorText,
      NOMIS_ESED: nomisDates?.effectiveSentenceEndDate,
      SENTENCE_LENGTH: errorText,
      NOMIS_ESL: keyDates.sentenceLength,
      NOMIS_JSL: keyDates.judiciallyImposedSentenceLength,
      ARE_DATES_SAME: errorText,
      ARE_DATES_SAME_USING_OVERRIDES: errorText,
      IS_ESL_SAME: errorText,
      IS_JSL_SAME: errorText,
      SENTENCES: JSON.stringify(sentenceAndOffences),
      ADJUSTMENTS: JSON.stringify(adjustments),
      RETURN_TO_CUSTODY: JSON.stringify(returnToCustody),
      ERROR_TEXT: ex.message,
      ERROR_JSON: JSON.stringify(ex),
    }
  }
  /* eslint-enable */

  public testCalculation: RequestHandler = async (req, res): Promise<void> => {
    const { username, token } = res.locals.user
    const { bookingData } = req.query
    try {
      const releaseDates = bookingData
        ? await this.calculateReleaseDatesService.calculateReleaseDates(username, bookingData, token)
        : ''

      res.render('pages/test-pages/testCalculation', {
        releaseDates: releaseDates ? JSON.stringify(releaseDates, undefined, 4) : '',
        bookingData,
      })
    } catch (ex) {
      logger.error(ex)
      const validationErrors =
        ex.status > 499 && ex.status < 600
          ? [
              {
                text: `There was an error in the calculation API service: ${ex.data.userMessage}`,
                href: '#bookingData',
              },
            ]
          : [
              {
                text: 'The JSON is malformed',
                href: '#bookingData',
              },
            ]
      res.render('pages/test-pages/testCalculation', {
        bookingData,
        validationErrors,
      })
    }
  }

  public getPrisonerImage: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params
    this.prisonerService
      .getPrisonerImage(username, nomsId)
      .then(data => {
        res.type('image/jpeg')
        data.pipe(res)
      })
      .catch(() => {
        const placeHolder = path.join(process.cwd(), '/assets/images/image-missing.png')
        res.sendFile(placeHolder)
      })
  }
}
