import { Request, Response } from 'express'
import { Controller } from '../controller'
import PrisonerService from '../../services/prisonerService'
import ViewReleaseDatesService from '../../services/viewReleaseDatesService'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import PrintNotificationSlipViewModel from '../../models/PrintNotificationSlipViewModel'
import ViewRouteSentenceAndOffenceViewModel from '../../models/ViewRouteSentenceAndOffenceViewModel'
import SentenceTypes from '../../models/SentenceTypes'
import { getFilteredListOfDates } from '../../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'

export default class ViewPrintNotificationSlipController implements Controller {
  constructor(
    private readonly viewReleaseDatesService: ViewReleaseDatesService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { caseloads, userRoles, username } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)
    const { fromPage, pageType } = req.query as Record<string, string>

    await this.prisonerService.checkPrisonerAccess(nomsId, username, caseloads, userRoles)

    const [prisonerDetail, sentencesAndOffences, releaseDateAndCalcContext, adjustmentsDtos] = await Promise.all([
      this.viewReleaseDatesService.getPrisonerDetail(calculationRequestId, username),
      this.viewReleaseDatesService.getSentencesAndOffences(calculationRequestId, username),
      this.calculateReleaseDatesService.getReleaseDatesForACalcReqId(calculationRequestId, username),
      this.viewReleaseDatesService.getAdjustmentsDtosForCalculation(calculationRequestId, username),
    ])

    const hasDTOSentence = sentencesAndOffences.some(sentence => SentenceTypes.isSentenceDto(sentence))
    const hasOnlyDTOSentences = sentencesAndOffences.every(sentence => SentenceTypes.isSentenceDto(sentence))
    const datesArray = Object.values(releaseDateAndCalcContext.dates)
      .filter(dateObject => dateObject && dateObject.date && getFilteredListOfDates().includes(dateObject.type))
      .map(dateObject => ({ code: dateObject.type, description: dateObject.description, date: dateObject.date }))

    const reasonForCalculation =
      releaseDateAndCalcContext.calculation.calculationReason != null
        ? releaseDateAndCalcContext.calculation.calculationReason.displayName
        : 'Not specified'

    res.render(
      'pages/printNotification/printNotificationSlip',
      new PrintNotificationSlipViewModel(
        new ViewRouteSentenceAndOffenceViewModel(
          prisonerDetail,
          null,
          sentencesAndOffences,
          null,
          null,
          null,
          null,
          null,
          null,
          adjustmentsDtos,
          null,
          null,
          null,
        ),
        calculationRequestId,
        nomsId,
        releaseDateAndCalcContext.calculation.calculationDate,
        datesArray,
        fromPage,
        pageType,
        reasonForCalculation,
        hasDTOSentence,
        hasOnlyDTOSentences,
      ),
    )
  }
}
