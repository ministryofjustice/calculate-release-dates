import { Request, Response } from 'express'
import { Controller } from '../controller'
import PrisonerService from '../../services/prisonerService'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import ViewPastNomisCalculationPageViewModel from '../../models/ViewPastNomisCalculationPageViewModel'
import { calculationSummaryDatesCardModelFromCalculationSummaryViewModel } from '../../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'

export default class ViewNomisCalculationSummaryController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { username } = res.locals.user
    const offenderSentCalculationId = Number(req.params.offenderSentCalculationId)

    const prisonerDetail = req.prisoner
    const pastNomisCalculation = await this.calculateReleaseDatesService.getNomisCalculationSummary(
      offenderSentCalculationId,
      username,
    )

    res.render(
      'pages/view/nomisCalculationSummary',
      new ViewPastNomisCalculationPageViewModel(
        prisonerDetail,
        pastNomisCalculation.calculatedAt,
        pastNomisCalculation.reason,
        'NOMIS',
        calculationSummaryDatesCardModelFromCalculationSummaryViewModel(pastNomisCalculation, false),
        pastNomisCalculation.calculatedByDisplayName,
      ),
    )
  }
}
