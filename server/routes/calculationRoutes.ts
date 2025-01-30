import { RequestHandler } from 'express'
import { DateTime } from 'luxon'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import logger from '../../logger'
import { ErrorMessages, ErrorMessageType } from '../types/ErrorMessages'
import { nunjucksEnv } from '../utils/nunjucksSetup'
import { FullPageError } from '../types/FullPageError'
import CalculationSummaryViewModel from '../models/CalculationSummaryViewModel'
import UserInputService from '../services/userInputService'
import { DetailedDate, ManualEntrySelectedDate } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import CalculationCompleteViewModel from '../models/CalculationCompleteViewModel'
import CalculationSummaryPageViewModel from '../models/CalculationSummaryPageViewModel'
import { calculationSummaryDatesCardModelFromCalculationSummaryViewModel } from '../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'
import {
  ApprovedDateActionConfig,
  approvedSummaryDatesCardModelFromCalculationSummaryViewModel,
} from '../views/pages/components/approved-summary-dates-card/ApprovedSummaryDatesCardModel'
import UserPermissionsService from '../services/userPermissionsService'
import CancelQuestionViewModel from '../models/CancelQuestionViewModel'
import config from '../config'

export default class CalculationRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly userInputService: UserInputService,
    private readonly userPermissionsService: UserPermissionsService,
  ) {
    // intentionally left blank
  }

  public calculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    await this.prisonerService.checkPrisonerAccess(nomsId, caseloads, token)
    const calculationRequestId = Number(req.params.calculationRequestId)
    if (
      req.session.selectedApprovedDates &&
      req.session.selectedApprovedDates[nomsId] &&
      req.session.selectedApprovedDates[nomsId].some((date: ManualEntrySelectedDate) => date.date === undefined)
    ) {
      req.session.selectedApprovedDates[nomsId] = []
    }
    const detailedCalculationResults = await this.calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments(
      calculationRequestId,
      token,
    )
    if (detailedCalculationResults.context.prisonerId !== nomsId) {
      throw FullPageError.notFoundError()
    }
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const serverErrors = req.flash('serverErrors')
    let validationErrors = null
    if (serverErrors && serverErrors[0]) {
      validationErrors = JSON.parse(serverErrors[0])
    }
    let approvedDates
    if (
      req.session.selectedApprovedDates &&
      req.session.selectedApprovedDates[nomsId] &&
      req.session.selectedApprovedDates[nomsId].length > 0
    ) {
      approvedDates = this.indexBy(req.session.selectedApprovedDates[nomsId])
    }
    if (!req.session.HDCED) {
      req.session.HDCED = {}
    }
    if (!req.session.HDCED_WEEKEND_ADJUSTED) {
      req.session.HDCED_WEEKEND_ADJUSTED = {}
    }
    if (detailedCalculationResults.dates.HDCED) {
      req.session.HDCED[nomsId] = detailedCalculationResults.dates.HDCED.date
      const hcedWeekendAdjusted = await this.calculateReleaseDatesService.getNextWorkingDay(
        detailedCalculationResults.dates.HDCED.date,
        token,
      )
      req.session.HDCED_WEEKEND_ADJUSTED[nomsId] =
        detailedCalculationResults.dates.HDCED.date != null && hcedWeekendAdjusted != null
    }
    const model = new CalculationSummaryViewModel(
      calculationRequestId,
      nomsId,
      prisonerDetail,
      detailedCalculationResults.calculationOriginalData.sentencesAndOffences,
      false,
      false,
      null,
      detailedCalculationResults.context.calculationReference,
      null,
      null,
      null,
      detailedCalculationResults.calculationBreakdown,
      detailedCalculationResults.releaseDatesWithAdjustments,
      validationErrors,
      false,
      approvedDates,
      null,
      detailedCalculationResults,
      config.featureToggles.genuineOverrides,
    )
    res.render(
      'pages/calculation/calculationSummary',
      new CalculationSummaryPageViewModel(
        model,
        calculationSummaryDatesCardModelFromCalculationSummaryViewModel(model, false),
        approvedSummaryDatesCardModelFromCalculationSummaryViewModel(model, true, {
          nomsId,
          calculationRequestId,
        } as ApprovedDateActionConfig),
        req.session.isAddDatesFlow,
        req.originalUrl,
      ),
    )
  }

  private indexBy(dates: ManualEntrySelectedDate[]) {
    const result = {}
    dates.forEach(date => {
      const dateString = `${date.date.year}-${date.date.month}-${date.date.day}`
      result[date.dateType] = DateTime.fromFormat(dateString, 'yyyy-M-d').toFormat('cccc, dd LLLL yyyy')
    })
    return result
  }

  private indexApprovedDates(dates: { [key: string]: string } | { [key: string]: DetailedDate }) {
    const result = {}
    Object.keys(dates).forEach((dateType: string) => {
      const date = dates[dateType]
      if (typeof date === 'string') {
        result[dateType] = DateTime.fromFormat(date, 'yyyy-MM-d').toFormat('cccc, dd LLLL yyyy')
      } else {
        result[dateType] = DateTime.fromFormat(date.date, 'yyyy-MM-d').toFormat('cccc, dd LLLL yyyy')
      }
    })
    return result
  }

  public printCalculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const detailedCalculationResults = await this.calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments(
      calculationRequestId,
      token,
    )

    if (detailedCalculationResults.context.prisonerId !== nomsId) {
      throw FullPageError.notFoundError()
    }

    const hasNone = 'None' in detailedCalculationResults.dates
    const approvedDates = detailedCalculationResults.approvedDates
      ? this.indexApprovedDates(detailedCalculationResults.approvedDates)
      : null
    const model = new CalculationSummaryViewModel(
      calculationRequestId,
      nomsId,
      prisonerDetail,
      detailedCalculationResults?.calculationOriginalData.sentencesAndOffences,
      hasNone,
      true,
      null,
      detailedCalculationResults.context.calculationReference,
      null,
      null,
      null,
      detailedCalculationResults.calculationBreakdown,
      detailedCalculationResults.releaseDatesWithAdjustments,
      null,
      false,
      approvedDates,
      null,
      detailedCalculationResults,
    )
    res.render(
      'pages/calculation/printCalculationSummary',
      new CalculationSummaryPageViewModel(
        model,
        calculationSummaryDatesCardModelFromCalculationSummaryViewModel(model, hasNone),
        approvedSummaryDatesCardModelFromCalculationSummaryViewModel(model, false),
        req.session.isAddDatesFlow,
        req.originalUrl,
      ),
    )
  }

  public submitCalculationSummary: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    const breakdownHtml = await this.getBreakdownFragment(calculationRequestId, token)
    const approvedDates =
      req.session.selectedApprovedDates != null && req.session.selectedApprovedDates[nomsId] != null
        ? req.session.selectedApprovedDates[nomsId]
        : []
    try {
      const bookingCalculation = await this.calculateReleaseDatesService.confirmCalculation(
        calculationRequestId,
        token,
        {
          calculationFragments: {
            breakdownHtml,
          },
          approvedDates,
          isSpecialistSupport: false,
        },
      )
      res.redirect(`/calculation/${nomsId}/complete/${bookingCalculation.calculationRequestId}`)
    } catch (error) {
      // TODO Move handling of validation errors from the api into the service layer
      logger.error(error)
      if (error.status === 412) {
        req.flash(
          'serverErrors',
          JSON.stringify({
            messages: [
              {
                text: 'The booking data that was used for this calculation has changed, go back to the Check NOMIS Information screen to see the changes',
                href: `/calculation/${nomsId}/check-information`,
              },
            ],
          } as ErrorMessages),
        )
      } else {
        req.flash(
          'serverErrors',
          JSON.stringify({
            messages: [{ text: 'The calculation could not be saved in NOMIS.' }],
            messageType: ErrorMessageType.SAVE_DATES,
          } as ErrorMessages),
        )
      }
      res.redirect(`/calculation/${nomsId}/summary/${calculationRequestId}`)
    }
  }

  public askCancelQuestion: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    let redirectUrl = typeof req.query.redirectUrl === 'string' ? req.query.redirectUrl : ''
    if (typeof req.query === 'object') {
      const params = new URLSearchParams()
      Object.keys(req.query).forEach(key => {
        if (key !== 'redirectUrl') {
          params.append(key, <string>req.query[key])
        }
      })
      const paramString = params.toString()
      if (paramString) {
        redirectUrl += `&${paramString}`
      }
    }
    return res.render('pages/calculation/cancel', new CancelQuestionViewModel(prisonerDetail, redirectUrl, false))
  }

  public submitCancelQuestion: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const { redirectUrl, cancelQuestion } = req.body
    if (cancelQuestion === 'no') {
      return res.redirect(redirectUrl)
    }
    if (cancelQuestion === 'yes') {
      return res.redirect(`/?prisonId=${nomsId}`)
    }
    return res.render(
      'pages/calculation/cancel',
      new CancelQuestionViewModel(prisonerDetail, redirectUrl, !cancelQuestion),
    )
  }

  public complete: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const noDates: string = <string>req.query.noDates
    const calculationRequestId = Number(req.params.calculationRequestId)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const calculation = await this.calculateReleaseDatesService.getCalculationResults(calculationRequestId, token)
    const hasIndeterminateSentence = await this.calculateReleaseDatesService.hasIndeterminateSentences(
      prisonerDetail.bookingId,
      token,
    )
    if (calculation.prisonerId !== nomsId || calculation.calculationStatus !== 'CONFIRMED') {
      throw FullPageError.notFoundError()
    }
    this.userInputService.resetCalculationUserInputForPrisoner(req, nomsId)
    res.render(
      'pages/calculation/calculationComplete',
      new CalculationCompleteViewModel(prisonerDetail, calculationRequestId, noDates, hasIndeterminateSentence),
    )
  }

  private async getBreakdownFragment(calculationRequestId: number, token: string): Promise<string> {
    return nunjucksEnv().render('pages/fragments/breakdownFragment.njk', {
      model: {
        ...(await this.calculateReleaseDatesService.getBreakdown(calculationRequestId, token)),
        showBreakdown: () => true,
      },
    })
  }
}
