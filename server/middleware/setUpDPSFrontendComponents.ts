import { RequestHandler } from 'express'
import { Services } from '../services'
import logger from '../../logger'

export default function setUpFrontendComponents({ frontEndComponentService }: Services): RequestHandler {
  return async (req, res, next) => {
    try {
      const { header } = await frontEndComponentService.getComponents(['header'], res.locals.user.token)

      res.locals.feComponents = {
        header: header.html,
        cssIncludes: [...header.css],
        jsIncludes: [...header.javascript],
      }
      next()
    } catch (error) {
      logger.error(error, 'Failed to retrieve front end components')
      next()
    }
  }
}
