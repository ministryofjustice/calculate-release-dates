import { RequestHandler } from 'express'
import logger from '../../logger'

export default class ErrorRoutes {
  public getPrisonerNotAccessiblePage: RequestHandler = async (req, res): Promise<void> => {
    logger.error('User is unable too access this prisoner')
    res.status(403)
    return res.render('pages/errors/prisonerNotAccessibleError')
  }
}
