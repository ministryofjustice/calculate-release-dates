import { Request, Response } from 'express'
import { Controller } from '../controller'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import PrisonerService from '../../services/prisonerService'
import config from '../../config'
import CalculationReasonViewModel from '../../models/calculation/CalculationReasonViewModel'
import CourtCasesReleaseDatesService from '../../services/courtCasesReleaseDatesService'
import { CalculationReasonForm } from './calculationReasonSchemaFactory'

export default class CalculationReasonController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly courtCasesReleaseDatesService: CourtCasesReleaseDatesService,
  ) {}

  GET = async (req: Request<{ nomsId: string; calculationRequestId: string }>, res: Response): Promise<void> => {
    const { user } = res.locals
    const { caseloads, token, userRoles } = user
    const { nomsId } = req.params
    const { isAddDatesFlow } = req.query as Record<string, string>
    if (!req.session.isAddDatesFlow) {
      req.session.isAddDatesFlow = {}
    }
    req.session.isAddDatesFlow[nomsId] = isAddDatesFlow === 'true'

    const calculationReasons = await this.calculateReleaseDatesService.getCalculationReasons(res.locals.user.token)
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, userRoles)

    const isSupportUser = user.isDigitalSupportUser || user.isSpecialistSupportUser
    if (!isSupportUser && config.featureToggles.thingsToDoIntercept) {
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

    if (req.session.isAddDatesFlow[nomsId] === true) {
      const approvedDatesReason = calculationReasons.find(it => it.useForApprovedDates === true).id
      this.setReason(req, nomsId, approvedDatesReason)
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }

    const calculationReasonId =
      res.locals?.formResponses?.calculationReasonId ?? req.session.calculationReasonId?.[nomsId]
    const otherReasonDescription =
      res.locals?.formResponses?.otherReasonDescription ?? req.session.otherReasonDescription?.[nomsId]

    return res.render(
      'pages/calculation/reason',
      new CalculationReasonViewModel(
        prisonerDetail,
        calculationReasons,
        calculationReasonId,
        otherReasonDescription,
        `/calculation/${nomsId}/reason`,
      ),
    )
  }

  POST = async (
    req: Request<{ nomsId: string; calculationRequestId: string }, unknown, CalculationReasonForm>,
    res: Response,
  ): Promise<void> => {
    const { caseloads, userRoles } = res.locals.user
    const { nomsId } = req.params
    const { calculationReasonId, otherReasonDescription } = req.body

    await this.prisonerService.checkPrisonerAccess(nomsId, caseloads, userRoles)
    this.setReason(req, nomsId, calculationReasonId, otherReasonDescription)

    return res.redirect(`/calculation/${nomsId}/check-information`)
  }

  private setReason(req: Request, nomsId: string, calculationReasonId: number, otherReasonDescription?: string) {
    if (req.session.calculationReasonId == null) {
      req.session.calculationReasonId = {}
      req.session.otherReasonDescription = {}
    }

    req.session.calculationReasonId[nomsId] = calculationReasonId
    req.session.otherReasonDescription[nomsId] = otherReasonDescription
  }
}
