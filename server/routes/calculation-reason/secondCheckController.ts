import { Request, Response } from 'express'
import { Controller } from '../controller'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import PrisonerService from '../../services/prisonerService'
import { CalculationReasonForm } from './calculationReasonSchemaFactory'

export default class SecondCheckController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
  ) {}

  GET = async (
    req: Request<{ nomsId: string; calculationRequestId: string }, unknown, CalculationReasonForm>,
    res: Response,
  ): Promise<void> => {
    const { caseloads, userRoles, username } = res.locals.user
    const { nomsId } = req.params

    await this.prisonerService.checkPrisonerAccess(nomsId, username, caseloads, userRoles)
    this.setReason(req, nomsId, 18)

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
