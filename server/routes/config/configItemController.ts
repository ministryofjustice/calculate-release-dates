import { Request, Response } from 'express'
import { Controller } from '../controller'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import { FullPageError } from '../../types/FullPageError'
import { featureTogglesToConfigItems } from '../../utils/utils'
import { ConfigItem } from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class ConfigItemController implements Controller {
  constructor(private readonly calculateReleaseDatesService: CalculateReleaseDatesService) {}

  GET = async (_: Request, res: Response): Promise<void> => {
    const { username, isDigitalSupportUser } = res.locals.user
    if (!isDigitalSupportUser) {
      throw FullPageError.notFoundError()
    }
    const apiConfigItems = await this.calculateReleaseDatesService.getApiConfigItems(username)
    const uiConfigItems = featureTogglesToConfigItems()

    return res.render('pages/config', {
      apiConfigItems: apiConfigItems.sort(this.sortConfigItems),
      uiConfigItems: uiConfigItems.sort(this.sortConfigItems),
    })
  }

  private sortConfigItems(a: ConfigItem, b: ConfigItem): number {
    const descriptionA = a.description.toUpperCase()
    const descriptionB = b.description.toUpperCase()
    if (descriptionA < descriptionB) {
      return -1
    }
    if (descriptionA > descriptionB) {
      return 1
    }
    return 0
  }
}
