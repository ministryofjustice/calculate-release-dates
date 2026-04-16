import { Request, Response } from 'express'
import { Controller } from '../../controller'
import GenuineOverrideUrls from '../genuineOverrideUrls'
import PrisonerService from '../../../services/prisonerService'
import GenuineOverrideHolidayInterceptViewModel from '../../../models/genuine-override/GenuineOverrideHolidayInterceptViewModel'

export default class GenuineOverrideHolidayInterceptController implements Controller {
  constructor(private readonly prisonerService: PrisonerService) {}

  GET = async (req: Request<{ nomsId: string; calculationRequestId: string }>, res: Response): Promise<void> => {
    const { nomsId, calculationRequestId } = req.params

    const prisonerDetail = req.prisoner

    return res.render(
      'pages/genuineOverrides/releaseDateOnHolidayIntercept',
      new GenuineOverrideHolidayInterceptViewModel(
        prisonerDetail,
        GenuineOverrideUrls.continueForHolidayInterceptOverride(nomsId, calculationRequestId),
        `/calculation/${nomsId}/select-reason-for-override/${calculationRequestId}`,
        GenuineOverrideUrls.interceptForWeekendHolidayGenuineOverride(nomsId, calculationRequestId),
      ),
    )
  }
}
