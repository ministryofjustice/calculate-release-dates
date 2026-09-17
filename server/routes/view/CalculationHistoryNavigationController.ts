import { Request, Response } from 'express'
import { Controller } from '../controller'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import config from '../../config'

export default class CalculationHistoryNavigationController implements Controller {
  constructor(private readonly calculateReleaseDatesService: CalculateReleaseDatesService) {}

  GET = async (req: Request<{ nomsId: string; direction: string }>, res: Response): Promise<void> => {
    const { nomsId, direction } = req.params
    const { currentPage } = req.query
    const { username } = res.locals.user
    const prisonerDetail = req.prisoner

    const isNewer = direction === 'newer'
    const requestedPage = Number(currentPage) + (isNewer ? -1 : 1)

    const history = await this.calculateReleaseDatesService.getCalculationHistoryPage(
      nomsId,
      requestedPage,
      config.calculationHistory.pageSize,
      username,
    )

    const calculationToSelect = isNewer ? history.items[history.items.length - 1] : history.items[0]

    res.redirect(
      `/view/${prisonerDetail.offenderNo}/calculation-history/${calculationToSelect.calculationSource}/${calculationToSelect.calculationSource === 'CRDS' ? calculationToSelect.crdsCalculationId : calculationToSelect.nomisCalculationId}/overview?page=${requestedPage}`,
    )
  }
}
