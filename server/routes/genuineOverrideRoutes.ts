import { RequestHandler } from 'express'
import UserPermissionsService from '../services/userPermissionsService'
import EntryPointService from '../services/entryPointService'
import PrisonerService from '../services/prisonerService'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import { FullPageError } from '../types/FullPageError'

export default class GenuineOverrideRoutes {
  constructor(
    private readonly userPermissionsService: UserPermissionsService,
    private readonly entryPointService: EntryPointService,
    private readonly prisonerService: PrisonerService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService
  ) {}

  public startPage: RequestHandler = async (req, res): Promise<void> => {
    const { calculationReference } = req.query as Record<string, string>
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      if (calculationReference) {
        this.entryPointService.setEmailEntryPoint(res, calculationReference)
        const { username, caseloads, token } = res.locals.user
        const calculation = await this.calculateReleaseDatesService.getCalculationResultsByReference(
          username,
          calculationReference,
          token
        )
        const prisonerDetail = await this.prisonerService.getPrisonerDetail(
          username,
          calculation.prisonerId,
          caseloads,
          token
        )
        return res.render('pages/genuineOverrides/index', { calculationReference, prisonerDetail })
      }
      this.entryPointService.setStandaloneEntrypointCookie(res)
      return res.render('pages/genuineOverrides/index', { calculationReference })
    }
    throw FullPageError.notFoundError()
  }
}
