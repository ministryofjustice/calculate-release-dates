import { Request, Response } from 'express'
import { Controller } from '../../controller'
import GenuineOverrideUrls from '../genuineOverrideUrls'
import { genuineOverrideInputsForPrisoner } from '../genuineOverrideUtils'
import PrisonerService from '../../../services/prisonerService'
import GenuineOverrideExpressInterceptViewModel from '../../../models/genuine-override/GenuineOverrideExpressInterceptViewModel'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'

export default class GenuineOverrideExpressInterceptController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
  ) {}

  GET = async (req: Request<{ nomsId: string; calculationRequestId: string }>, res: Response): Promise<void> => {
    const { nomsId, calculationRequestId } = req.params
    const { caseloads, username, userRoles } = res.locals.user

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, userRoles)
    const genuineOverrideInputs = genuineOverrideInputsForPrisoner(req, nomsId)
    const genuineOverrideReasons = await this.calculateReleaseDatesService.getGenuineOverrideReasons(username)
    const reason =
      genuineOverrideInputs.previousOverride.reasonFurtherDetail ??
      genuineOverrideReasons.find(it => it.code === genuineOverrideInputs.previousOverride.reason).description

    return res.render(
      'pages/genuineOverrides/expressIntercept',
      new GenuineOverrideExpressInterceptViewModel(
        prisonerDetail,
        reason,
        `/calculation/${nomsId}/summary/${calculationRequestId}`,
        GenuineOverrideUrls.interceptForExpressOverride(nomsId, calculationRequestId),
      ),
    )
  }

  POST = async (req: Request<{ nomsId: string; calculationRequestId: string }>, res: Response): Promise<void> => {
    const { nomsId, calculationRequestId } = req.params
    return res.redirect(GenuineOverrideUrls.reviewDateFromPreviousOverride(nomsId, calculationRequestId))
  }
}
