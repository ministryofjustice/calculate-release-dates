import { RequestHandler } from 'express'
import path from 'path'
import { stringify } from 'csv-stringify'
import dayjs from 'dayjs'
import _ from 'lodash'
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
import { indexBy } from '../utils/utils'
import OneThousandCalculationsService from '../services/oneThousandCalculationsService'

export default class OtherRoutes {
  constructor(private readonly oneThousandCalculationsService: OneThousandCalculationsService) {}

  // TODO Remove this submitTestCalculation method and associated code - only in place to aid bulk testing of the calculation algorithm
  /* eslint-disable */
  public submitTestCalculation: RequestHandler = async (req, res) => {
    const { username, caseloads, token } = res.locals.user
    const { prisonerIds } = req.body
    const nomsIds = prisonerIds.split(/\r?\n/)
    if (nomsIds.length > 500) return res.redirect(`/test/calculation`)

    const results = await this.oneThousandCalculationsService.runCalculations(username, caseloads, token, nomsIds)
    const fileName = `download-release-dates.csv`
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    stringify(results, {
      header: true,
    }).pipe(res)
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
      NOMIS_CRD_OVERRIDE: nomisDates?.conditionalReleaseOverrideDate,
      LED: errorText,
      NOMIS_LED: nomisDates?.licenceExpiryDate,
      NOMIS_LED_CALCULATED: nomisDates?.licenseExpiryCalculatedDate,
      NOMIS_LED_OVERRIDE: nomisDates?.licenseExpiryOverrideDate,
      SED: errorText,
      NOMIS_SED: nomisDates?.sentenceExpiryDate,
      NOMIS_SED_CALCULATED: nomisDates?.sentenceExpiryCalculatedDate,
      NOMIS_SED_OVERRIDE: nomisDates?.sentenceExpiryOverrideDate,
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
      NOMIS_PED_CALCULATED: nomisDates?.paroleEligibilityCalculatedDate,
      NOMIS_PED_OVERRIDE: nomisDates?.paroleEligibilityOverrideDate,
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
      SEX_OFFENDER: this.isSexOffender(prisoner),
      LOCATION: prisoner?.locationDescription,
      SENTENCES: JSON.stringify(sentenceAndOffences),
      ADJUSTMENTS: JSON.stringify(adjustments),
      RETURN_TO_CUSTODY: JSON.stringify(returnToCustody),
      CONSECUTIVE_SENTENCES: this.getConsecutiveSentences(sentenceAndOffences),
      ERROR_TEXT: ex.message,
      ERROR_JSON: JSON.stringify(ex),
    }
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
