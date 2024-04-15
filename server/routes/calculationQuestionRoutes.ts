import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import CalculationReasonViewModel from '../models/CalculationReasonViewModel'

export default class CalculationQuestionRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
  ) {
    // intentionally left blank
  }

  public selectCalculationReason: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const calculationReasons = await this.calculateReleaseDatesService.getCalculationReasons(res.locals.user.token)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    return res.render('pages/calculation/reason', new CalculationReasonViewModel(prisonerDetail, calculationReasons))
  }

  public submitCalculationReason: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const calculationReasons = await this.calculateReleaseDatesService.getCalculationReasons(res.locals.user.token)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const otherId = calculationReasons.find(calculation => calculation.isOther).id

    if (req.body.calculationReasonId == null) {
      return res.render(
        'pages/calculation/reason',
        new CalculationReasonViewModel(prisonerDetail, calculationReasons, {
          text: 'You must select a reason for the calculation',
        }),
      )
    }

    if (+req.body.calculationReasonId === otherId && req.body.otherReasonDescription.length === 0) {
      return res.render(
        'pages/calculation/reason',
        new CalculationReasonViewModel(prisonerDetail, calculationReasons, undefined, {
          text: 'You must enter a reason for the calculation',
          id: otherId,
        }),
      )
    }

    if (+req.body.calculationReasonId === otherId && req.body.otherReasonDescription.length >= 120) {
      return res.render(
        'pages/calculation/reason',
        new CalculationReasonViewModel(prisonerDetail, calculationReasons, undefined, {
          text: 'Reason must be 120 characters or less',
          id: otherId,
          otherText: req.body.otherReasonDescription,
        }),
      )
    }

    if (req.session.calculationReasonId == null) {
      req.session.calculationReasonId = {}
      req.session.otherReasonDescription = {}
    }

    req.session.calculationReasonId[nomsId] = req.body.calculationReasonId
    req.session.otherReasonDescription[nomsId] = req.body.otherReasonDescription

    return res.redirect(`/calculation/${nomsId}/check-information`)
  }
}
