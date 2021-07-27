import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'

export default class OtherRoutes {
  constructor(private readonly calculateReleaseDatesService: CalculateReleaseDatesService) {}

  public listTestData: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const testData = await this.calculateReleaseDatesService.getTestData(username)
    res.render('pages/testData', { testData })
  }
}
