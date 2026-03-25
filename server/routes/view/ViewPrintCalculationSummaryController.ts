import { Request, Response } from 'express'
import { DateTime } from 'luxon'
import { Controller } from '../controller'
import PrisonerService from '../../services/prisonerService'
import ViewReleaseDatesService from '../../services/viewReleaseDatesService'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import CalculationSummaryViewModel from '../../models/calculation/CalculationSummaryViewModel'
import { DetailedDate } from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { longDateFormat } from '../../utils/utils'
import { ErrorMessages, ErrorMessageType } from '../../types/ErrorMessages'
import ViewCalculateReleaseDatePageViewModel from '../../models/ViewCalculateReleaseDatePageViewModel'
import { calculationSummaryDatesCardModelFromCalculationSummaryViewModel } from '../../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'
import { approvedSummaryDatesCardModelFromCalculationSummaryViewModel } from '../../views/pages/components/approved-summary-dates-card/ApprovedSummaryDatesCardModel'
import { hasGenuineOverridesAccess } from '../genuine-overrides/genuineOverrideUtils'

export default class ViewPrintCalculationSummaryController implements Controller {
  constructor(
    private readonly viewReleaseDatesService: ViewReleaseDatesService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
  ) {}

  private indexBy(dates: { [key: string]: string } | { [key: string]: DetailedDate }) {
    const result: Record<string, string> = {}
    Object.keys(dates).forEach((dateType: string) => {
      const date = dates[dateType]
      if (typeof date === 'string') {
        result[dateType] = DateTime.fromFormat(date, 'yyyy-MM-d').toFormat('cccc, dd MMMM yyyy')
      } else {
        result[dateType] = DateTime.fromFormat(date.date, 'yyyy-MM-d').toFormat('cccc, dd MMMM yyyy')
      }
    })
    return result
  }

  private async calculateReleaseDatesViewModel(
    calculationRequestId: number,
    nomsId: string,
    caseloads: string[],
    userRoles: string[],
    username: string,
  ): Promise<CalculationSummaryViewModel> {
    const detailedCalculationResults = await this.calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments(
      calculationRequestId,
      username,
    )
    const hasErsed = 'ERSED' in detailedCalculationResults.dates
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)
    const { calculationBreakdown, calculationOriginalData, breakdownMissingReason, releaseDatesWithAdjustments } =
      detailedCalculationResults
    if (!calculationBreakdown && breakdownMissingReason && breakdownMissingReason === 'PRISON_API_DATA_MISSING') {
      return new CalculationSummaryViewModel(
        calculationRequestId,
        nomsId,
        prisonerDetail,
        null,
        false,
        true,
        detailedCalculationResults.context.calculationType,
        detailedCalculationResults.context.calculationReference,
        hasErsed,
        null,
        null,
        null,
        null,
        null,
        {
          messages: [
            {
              html: `To view the sentence and offence information and the calculation breakdown, you will need to <a href="/calculation/${nomsId}/reason">calculate release dates again.</a>`,
            },
          ],
          messageType: ErrorMessageType.MISSING_PRISON_API_DATA,
        } as ErrorMessages,
        true,
        undefined,
        detailedCalculationResults,
        hasGenuineOverridesAccess(),
        detailedCalculationResults.context.genuineOverrideReasonDescription,
        detailedCalculationResults.context.calculatedByDisplayName,
        detailedCalculationResults.context.calculatedAtPrisonDescription,
      )
    }
    const hasNone = detailedCalculationResults.dates.None !== undefined
    const approvedDates = detailedCalculationResults.approvedDates
      ? this.indexBy(detailedCalculationResults.approvedDates)
      : null
    return new CalculationSummaryViewModel(
      calculationRequestId,
      nomsId,
      prisonerDetail,
      calculationOriginalData.sentencesAndOffences,
      hasNone,
      true,
      detailedCalculationResults.context.calculationType,
      detailedCalculationResults.context.calculationReference,
      hasErsed,
      detailedCalculationResults.context.calculationReason,
      detailedCalculationResults.context.otherReasonDescription,
      detailedCalculationResults.context.calculationDate === undefined
        ? undefined
        : longDateFormat(detailedCalculationResults.context.calculationDate),
      calculationBreakdown,
      releaseDatesWithAdjustments,
      null,
      false,
      approvedDates,
      detailedCalculationResults,
      hasGenuineOverridesAccess(),
      detailedCalculationResults.context.genuineOverrideReasonDescription,
      detailedCalculationResults.context.calculatedByDisplayName,
      detailedCalculationResults.context.calculatedAtPrisonDescription,
    )
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { nomsId } = req.params
    const { caseloads, userRoles, username } = res.locals.user
    const calculationRequestId = Number(req.params.calculationRequestId)

    await this.prisonerService.checkPrisonerAccess(nomsId, username, caseloads, userRoles)
    const model = await this.calculateReleaseDatesViewModel(
      calculationRequestId,
      nomsId,
      caseloads,
      userRoles,
      username,
    )

    res.render(
      'pages/view/printCalculationSummary',
      new ViewCalculateReleaseDatePageViewModel(
        model,
        calculationSummaryDatesCardModelFromCalculationSummaryViewModel(model, model.hasNone),
        approvedSummaryDatesCardModelFromCalculationSummaryViewModel(model, false),
        nomsId,
      ),
    )
  }
}
