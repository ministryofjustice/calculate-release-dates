import { Request, Response, NextFunction } from 'express'
import { Controller } from '../controller'
import { FullPageError } from '../../types/FullPageError'
import PrisonerService from '../../services/prisonerService'
import ViewReleaseDatesService from '../../services/viewReleaseDatesService'

export default class ViewJourneyController implements Controller {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly viewReleaseDatesService: ViewReleaseDatesService,
  ) {}

  GET = async (req: Request, res: Response, next?: NextFunction): Promise<void> => {
    const { caseloads, userRoles, username } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)
    try {
      const latestCalculation = await this.viewReleaseDatesService.getLatestCalculation(
        nomsId,
        prisonerDetail.bookingId,
        username,
      )
      res.redirect(`/view/${nomsId}/sentences-and-offences/${latestCalculation.calculationRequestId}`)
    } catch (error) {
      if ((error.status ?? error.responseStatus) === 404) {
        throw FullPageError.noCalculationSubmitted(nomsId, prisonerDetail)
      }
    }
  }
}
