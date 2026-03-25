import { Request, Response } from 'express'
import path from 'path'
import { Controller } from '../controller'
import PrisonerService from '../../services/prisonerService'
import logger from '../../../logger'

export default class OtherController implements Controller {
  constructor(private readonly prisonerService: PrisonerService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params

    try {
      const imageStream = await this.prisonerService.getPrisonerImage(username, nomsId)
      res.type('image/jpeg')
      imageStream.pipe(res)
    } catch (error) {
      logger.warn(`Failed to retrieve image for ${nomsId} using default (message: ${(error as Error).message})`)
      const placeHolder = path.join(process.cwd(), '/assets/images/image-missing.png')
      res.sendFile(placeHolder)
    }
  }
}
