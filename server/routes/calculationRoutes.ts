import { RequestHandler } from 'express'
import { DateTime } from 'luxon'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import { FullPageError } from '../types/FullPageError'
import CalculationSummaryViewModel from '../models/calculation/CalculationSummaryViewModel'
import UserInputService from '../services/userInputService'
import { DetailedDate } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import CalculationCompleteViewModel from '../models/calculation/CalculationCompleteViewModel'
import CalculationSummaryPageViewModel from '../models/calculation/CalculationSummaryPageViewModel'
import { calculationSummaryDatesCardModelFromCalculationSummaryViewModel } from '../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'
import { approvedSummaryDatesCardModelFromCalculationSummaryViewModel } from '../views/pages/components/approved-summary-dates-card/ApprovedSummaryDatesCardModel'
import CancelQuestionViewModel from '../models/CancelQuestionViewModel'
import ConcurrentConsecutiveSentence from '../models/ConcurrentConsecutiveSentencesModel'

export default class CalculationRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly userInputService: UserInputService,
  ) {
    // intentionally left blank
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
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)
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
      null,
      detailedCalculationResults.calculationBreakdown,
      detailedCalculationResults.releaseDatesWithAdjustments,
      null,
      false,
      approvedDates,
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

  public askCancelQuestion: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)
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
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)
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
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params
    const noDates: string = <string>req.query.noDates
    const calculationRequestId = Number(req.params.calculationRequestId)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)
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

  public concurrentConsecutive: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, userRoles } = res.locals.user
    const { nomsId } = req.params
    const { duration } = req.query as Record<string, string>
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

    if (req.session.calculationReasonId == null || duration == null) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }

    return res.render(
      'pages/calculation/consecutiveConcurrentSentences',
      new ConcurrentConsecutiveSentence(
        prisonerDetail,
        duration,
        `/calculation/${nomsId}/cancelCalculation?redirectUrl=/calculation/${nomsId}/check-information`,
        `/calculation/${nomsId}/check-information/`,
      ),
    )
  }

  public confirmConcurrentConsecutive: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId } = req.params
    const { sentenceDuration } = req.body

    const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)
    const calculationRequestModel = await this.calculateReleaseDatesService.getCalculationRequestModel(
      req,
      userInputs,
      nomsId,
    )

    const preliminaryRequest = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(
      nomsId,
      calculationRequestModel,
      token,
    )

    res.redirect(
      `summary/${preliminaryRequest.calculationRequestId}?callbackUrl=/calculation/${nomsId}/concurrent-consecutive?duration=${sentenceDuration}`,
    )
  }
}
