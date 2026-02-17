import { Request, Response } from 'express'
import { Controller } from '../controller'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import PrisonerService from '../../services/prisonerService'
import { CalculationSummaryForm } from './calculationSummarySchema'
import {
  calculationSummaryDatesCardModelFromOverridesViewModel,
  filteredListOfDates,
} from '../../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'
import CalculationSummaryOverridesViewModel from '../../models/calculation/CalculationSummaryOverridesViewModel'
import { sortDisplayableDates } from '../../utils/utils'

export default class CalculationSummaryOverridesController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
  ) {}

  GET = async (
    req: Request<{ nomsId: string; calculationRequestId: string }, unknown, CalculationSummaryForm>,
    res: Response,
  ): Promise<void> => {
    const { nomsId } = req.params
    const { caseloads, userRoles, username } = res.locals.user
    const calculationRequestId = Number(req.params.calculationRequestId)
    await this.prisonerService.checkPrisonerAccess(nomsId, username, caseloads, userRoles)

    const model = await this.calculateReleaseDatesOverridesViewModel(
      calculationRequestId,
      nomsId,
      caseloads,
      userRoles,
      username,
    )

    if (model === null) {
      return res.redirect(`/view/${nomsId}/calculation-summary/${calculationRequestId}`)
    }

    return res.render('pages/view/calculationSummaryOverrides', { model })
  }

  public async calculateReleaseDatesOverridesViewModel(
    calculationRequestId: number,
    nomsId: string,
    caseloads: string[],
    userRoles: string[],
    username: string,
  ) {
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)
    const overrideResults = await this.calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments(
      calculationRequestId,
      username,
    )

    const overrideRequestId = overrideResults.context.overridesCalculationRequestId

    if (!overrideRequestId) {
      return null
    }

    const currentResults = await this.calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments(
      overrideRequestId,
      username,
    )

    const overrideReason = currentResults.context.genuineOverrideReasonDescription
    const overrideDates = sortDisplayableDates(Object.values(overrideResults.dates))
    const currentDates = sortDisplayableDates(
      Object.values(currentResults.dates).filter(d => filteredListOfDates.includes(d.type)),
    )

    const crdsDateLines = calculationSummaryDatesCardModelFromOverridesViewModel(currentDates)
    const overrideDateLines = calculationSummaryDatesCardModelFromOverridesViewModel(overrideDates)

    return new CalculationSummaryOverridesViewModel(
      calculationRequestId,
      nomsId,
      prisonerDetail,
      overrideResults.context.calculatedByDisplayName,
      overrideReason,
      crdsDateLines,
      overrideDateLines,
    )
  }
}
