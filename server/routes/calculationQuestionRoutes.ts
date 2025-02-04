import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import CalculationReasonViewModel from '../models/CalculationReasonViewModel'
import CourtCasesReleaseDatesService from '../services/courtCasesReleaseDatesService'
import config from '../config'

export default class CalculationQuestionRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly courtCasesReleaseDatesService: CourtCasesReleaseDatesService,
  ) {
    // intentionally left blank
  }

  public selectCalculationReason: RequestHandler = async (req, res): Promise<void> => {
    const { user } = res.locals
    const { caseloads, token } = user
    const { nomsId } = req.params
    const { isAddDatesFlow } = req.query as Record<string, string>
    req.session.isAddDatesFlow = isAddDatesFlow === 'true'

    const calculationReasons = await this.calculateReleaseDatesService.getCalculationReasons(res.locals.user.token)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const isSupportUser = user.isDigitalSupportUser || user.isSpecialistSupportUser
    if (res.locals.showCCARDNav && !isSupportUser && config.featureToggles.thingsToDoIntercept) {
      const serviceDefinitions = await this.courtCasesReleaseDatesService.getServiceDefinitions(nomsId, token)

      const anyNonCrdsThingsToDo = Object.keys(serviceDefinitions.services)
        .filter(it => it !== 'releaseDates')
        .some(it => serviceDefinitions.services[it].thingsToDo.count > 0)

      if (anyNonCrdsThingsToDo) {
        if (config.featureToggles.showCrdsIntercept) {
          return res.redirect(`/calculation/${nomsId}/things-to-do-before-calculation`)
        }
        return res.redirect(`${config.adjustments.url}/${nomsId}/additional-days/intercept`)
      }
    }

    return res.render(
      'pages/calculation/reason',
      new CalculationReasonViewModel(prisonerDetail, calculationReasons, null, null, req.originalUrl),
    )
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
        new CalculationReasonViewModel(
          prisonerDetail,
          calculationReasons,
          {
            text: 'You must select a reason for the calculation',
          },
          null,
          req.originalUrl,
        ),
      )
    }

    if (+req.body.calculationReasonId === otherId && req.body.otherReasonDescription.length === 0) {
      return res.render(
        'pages/calculation/reason',
        new CalculationReasonViewModel(
          prisonerDetail,
          calculationReasons,
          undefined,
          {
            text: 'You must enter a reason for the calculation',
            id: otherId,
          },
          req.originalUrl,
        ),
      )
    }

    if (+req.body.calculationReasonId === otherId && req.body.otherReasonDescription.length >= 120) {
      return res.render(
        'pages/calculation/reason',
        new CalculationReasonViewModel(
          prisonerDetail,
          calculationReasons,
          undefined,
          {
            text: 'Reason must be 120 characters or less',
            id: otherId,
            otherText: req.body.otherReasonDescription,
          },
          req.originalUrl,
        ),
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
