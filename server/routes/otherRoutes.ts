import { RequestHandler } from 'express'
import path from 'path'
import { stringify } from 'csv-stringify'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import logger from '../../logger'
import { Prisoner } from '../@types/prisonerOffenderSearch/prisonerSearchClientTypes'
import { BookingCalculation } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiSentenceAdjustmentDetail,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'

export default class OtherRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService
  ) {}

  // TODO Remove this submitTestCalculation method and associated code - only in place to aid bulk testing of the calculation algorithm
  /* eslint-disable */
  public submitTestCalculation: RequestHandler = async (req, res) => {
    const { username, token } = res.locals.user
    const { prisonerIds } = req.body
    const nomsIds = prisonerIds.split(/\r?\n/)
    if (nomsIds.length > 500) return res.redirect(`/test/calculation`)

    const nomisResults = await this.prisonerService.searchPrisonerNumbers(username, nomsIds)

    const csvData = []

    // This is just temporary code therefore the iterative loop rather than an async approach (was easier to develop and easier to debug)
    for (const nomsId of nomsIds) {
      try {
        const nomisRecord = nomisResults.find(a => a.prisonerNumber === nomsId)
        const bookingId = nomisRecord.bookingId as unknown as number
        const nomisDates = await this.prisonerService.getSentenceDetail(username, bookingId, token)
        const sentenceAndOffences = await this.prisonerService.getSentencesAndOffences(username, bookingId, token)
        const adjustments = await this.prisonerService.getSentenceAdjustments(username, bookingId, token)
        try {
          const calc = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(username, nomsId, token)
          csvData.push(this.addRow(nomisRecord, calc, nomisDates, sentenceAndOffences, adjustments))
        } catch (ex) {
          csvData.push(this.addErrorRow(nomisRecord, nomisDates, sentenceAndOffences, adjustments, ex))
        }
      } catch (ex) {
        csvData.push(OtherRoutes.addNonCrdErrorRow(nomsId, ex))
      }
    }

    const fileName = `download-release-dates.csv`
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    stringify(csvData, { header: true }).pipe(res)
  }

  private addRow(
    prisoner: Prisoner,
    calc: BookingCalculation,
    nomisDates: PrisonApiSentenceDetail,
    sentenceAndOffences: PrisonApiOffenderSentenceAndOffences[],
    adjustments: PrisonApiSentenceAdjustmentDetail
  ) {
    const row = {
      NOMS_ID: prisoner.prisonerNumber,
      DOB: prisoner.dateOfBirth,
      REQUEST_ID: calc.calculationRequestId,
      CALCULATED_DATES: calc.dates,
      CRD: calc.dates.CRD,
      NOMIS_CRD: nomisDates.conditionalReleaseOverrideDate || nomisDates.conditionalReleaseDate,
      LED: calc.dates.LED || calc.dates.SLED,
      NOMIS_LED: nomisDates.licenceExpiryDate,
      SED: calc.dates.SED || calc.dates.SLED,
      NOMIS_SED: nomisDates.sentenceExpiryDate,
      NPD: calc.dates.NPD,
      NOMIS_NPD: nomisDates.nonParoleOverrideDate || nomisDates.nonParoleDate,
      ARD: calc.dates.ARD,
      NOMIS_ARD: nomisDates.automaticReleaseOverrideDate || nomisDates.automaticReleaseDate,
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
      NOMIS_DPRRD: nomisDates.dtoPostRecallReleaseDateOverride || nomisDates.postRecallReleaseDate,
      PRRD: calc.dates.PRRD,
      NOMIS_PRRD: nomisDates.postRecallReleaseOverrideDate || nomisDates.postRecallReleaseDate,
      ESED: calc.dates.ESED,
      NOMIS_ESED: nomisDates.effectiveSentenceEndDate,
    }
    return {
      ...row,
      ARE_DATES_SAME: OtherRoutes.areDatesSame(row) ? 'Y' : 'N',
      SENTENCES: JSON.stringify(sentenceAndOffences),
      ADJUSTMENTS: JSON.stringify(adjustments),
      error: null as string,
    }
  }

  private static areDatesSame(row: any) {
    const areSame = (nomisDate: string, calculatedDate: string) => {
      if (!nomisDate && !calculatedDate) return true
      if (!nomisDate && calculatedDate) return false
      if (nomisDate && !calculatedDate) return false
      return nomisDate === calculatedDate
    }

    return (
      areSame(row.CRD, row.NOMIS_CRD) &&
      areSame(row.SED, row.NOMIS_SED) &&
      areSame(row.LED, row.NOMIS_LED) &&
      areSame(row.NPD, row.NOMIS_NPD) &&
      areSame(row.ARD, row.NOMIS_ARD) &&
      areSame(row.TUSED, row.NOMIS_TUSED) &&
      areSame(row.PED, row.NOMIS_PED) &&
      areSame(row.HDCED, row.NOMIS_HDCED) &&
      areSame(row.ETD, row.NOMIS_ETD) &&
      areSame(row.MTD, row.NOMIS_MTD) &&
      areSame(row.LTD, row.NOMIS_LTD) &&
      areSame(row.DPRRD, row.NOMIS_DPRRD) &&
      areSame(row.PRRD, row.NOMIS_PRRD) &&
      areSame(row.ESED, row.NOMIS_ESED)
    )
  }

  private addErrorRow(
    prisoner: Prisoner,
    nomisDates: PrisonApiSentenceDetail,
    sentenceAndOffences: PrisonApiOffenderSentenceAndOffences[],
    adjustments: PrisonApiSentenceAdjustmentDetail,
    ex: any
  ) {
    return {
      NOMS_ID: prisoner.prisonerNumber,
      DOB: prisoner.dateOfBirth,
      REQUEST_ID: 'error',
      CALCULATED_DATES: 'error',
      CRD: 'error',
      NOMIS_CRD: nomisDates.conditionalReleaseDate,
      LED: 'error',
      NOMIS_LED: nomisDates.licenceExpiryDate,
      SED: 'error',
      NOMIS_SED: nomisDates.sentenceExpiryDate,
      NPD: 'error',
      NOMIS_NPD: nomisDates.nonParoleOverrideDate || nomisDates.nonParoleDate,
      ARD: 'error',
      NOMIS_ARD: nomisDates.automaticReleaseOverrideDate || nomisDates.automaticReleaseDate,
      TUSED: 'error',
      NOMIS_TUSED: nomisDates.topupSupervisionExpiryDate,
      PED: 'error',
      NOMIS_PED: nomisDates.paroleEligibilityDate,
      HDCED: 'error',
      NOMIS_HDCED: nomisDates.homeDetentionCurfewEligibilityDate,
      ETD: 'error',
      NOMIS_ETD: nomisDates.earlyTermDate,
      MTD: 'error',
      NOMIS_MTD: nomisDates.midTermDate,
      LTD: 'error',
      NOMIS_LTD: nomisDates.lateTermDate,
      DPRRD: 'error',
      NOMIS_DPRRD: nomisDates.dtoPostRecallReleaseDateOverride || nomisDates.postRecallReleaseDate,
      PRRD: 'error',
      NOMIS_PRRD: nomisDates.postRecallReleaseOverrideDate || nomisDates.postRecallReleaseDate,
      ESED: 'error',
      NOMIS_ESED: nomisDates.effectiveSentenceEndDate,
      ARE_DATES_SAME: 'error',
      SENTENCES: JSON.stringify(sentenceAndOffences),
      ADJUSTMENTS: JSON.stringify(adjustments),
      error: ex,
    }
  }

  private static addNonCrdErrorRow(nomsId: string, ex: any) {
    return {
      NOMS_ID: nomsId,
      DOB: 'non-crd error',
      REQUEST_ID: 'non-crd error',
      CALCULATED_DATES: 'non-crd error',
      CRD: 'non-crd error',
      NOMIS_CRD: 'non-crd error',
      LED: 'non-crd error',
      NOMIS_LED: 'non-crd error',
      SED: 'non-crd error',
      NOMIS_SED: 'non-crd error',
      NPD: 'non-crd error',
      NOMIS_NPD: 'non-crd error',
      ARD: 'non-crd error',
      NOMIS_ARD: 'non-crd error',
      TUSED: 'non-crd error',
      NOMIS_TUSED: 'non-crd error',
      PED: 'non-crd error',
      NOMIS_PED: 'non-crd error',
      HDCED: 'non-crd error',
      NOMIS_HDCED: 'non-crd error',
      ETD: 'non-crd error',
      NOMIS_ETD: 'non-crd error',
      MTD: 'non-crd error',
      NOMIS_MTD: 'non-crd error',
      LTD: 'non-crd error',
      NOMIS_LTD: 'non-crd error',
      DPRRD: 'non-crd error',
      NOMIS_DPRRD: 'non-crd error',
      PRRD: 'non-crd error',
      NOMIS_PRRD: 'non-crd error',
      ESED: 'non-crd error',
      NOMIS_ESED: 'non-crd error',
      ARE_DATES_SAME: 'non-crd error',
      SENTENCES: 'non-crd error',
      ADJUSTMENTS: 'non-crd error',
      error: `${ex.message}: ${JSON.stringify(ex)}`,
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
