import { RequestHandler } from 'express'
import path from 'path'
import PrisonerService from '../services/prisonerService'
import logger from '../../logger'

export default class OtherRoutes {
  constructor(private readonly prisonerService: PrisonerService) {
    // intentionally left blank
  }

  public getPrisonerImage: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params
    this.prisonerService
      .getPrisonerImage(username, nomsId)
      .then(data => {
        res.type('image/jpeg')
        data.pipe(res)
      })
      .catch(error => {
        logger.warn(`Failed to retrieve image for ${nomsId} using default (message: ${error.message})`)
        const placeHolder = path.join(process.cwd(), '/assets/images/image-missing.png')
        res.sendFile(placeHolder)
      })
  }
}
