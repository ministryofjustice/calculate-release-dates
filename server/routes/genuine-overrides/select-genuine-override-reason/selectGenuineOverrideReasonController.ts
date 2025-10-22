import { Request, Response } from 'express'
import { Controller } from '../../controller'
import GenuineOverrideUrls from '../genuineOverrideUrls'
import { genuineOverrideInputsForPrisoner } from '../genuineOverrideUtils'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import GenuineOverrideSelectReasonViewModel from '../../../models/genuine-override/GenuineOverrideSelectReasonViewModel'
import PrisonerService from '../../../services/prisonerService'
import { SelectGenuineOverrideReasonForm } from './selectGenuineOverrideReasonSchemas'

export default class SelectGenuineOverrideReasonController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
  ) {}

  GET = async (req: Request<{ nomsId: string; calculationRequestId: string }>, res: Response): Promise<void> => {
    const { nomsId, calculationRequestId } = req.params
    const { caseloads, token, userRoles } = res.locals.user

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, token, caseloads, userRoles)

    const genuineOverrideInputs = genuineOverrideInputsForPrisoner(req, nomsId)
    const reason = res.locals?.formResponses?.reason ?? genuineOverrideInputs?.reason
    const reasonFurtherDetail =
      res.locals?.formResponses?.reasonFurtherDetail ?? genuineOverrideInputs?.reasonFurtherDetail
    const reasons = await this.calculateReleaseDatesService
      .getGenuineOverrideReasons(res.locals.user.token)
      .then(unsortedReasons => unsortedReasons.sort((a, b) => a.displayOrder - b.displayOrder))

    const backLink =
      genuineOverrideInputs.mode === 'STANDARD'
        ? `/calculation/${nomsId}/summary/${calculationRequestId}`
        : GenuineOverrideUrls.reviewDateFromPreviousOverride(nomsId, calculationRequestId)

    return res.render(
      'pages/genuineOverrides/selectGenuineOverrideReason',
      new GenuineOverrideSelectReasonViewModel(
        prisonerDetail,
        reasons,
        reason,
        reasonFurtherDetail,
        backLink,
        GenuineOverrideUrls.selectReasonForOverride(nomsId, calculationRequestId),
      ),
    )
  }

  POST = async (
    req: Request<{ nomsId: string; calculationRequestId: string }, unknown, SelectGenuineOverrideReasonForm>,
    res: Response,
  ): Promise<void> => {
    const { nomsId, calculationRequestId } = req.params
    const genuineOverrideInputs = genuineOverrideInputsForPrisoner(req, nomsId)
    const { reason, reasonFurtherDetail } = req.body
    genuineOverrideInputs.reason = reason
    genuineOverrideInputs.reasonFurtherDetail = reasonFurtherDetail
    return res.redirect(GenuineOverrideUrls.reviewDatesForOverride(nomsId, calculationRequestId))
  }
}
