import { RequestHandler } from 'express'
import { Services } from '../services'
import logger from '../../logger'

export default function setUpFrontendComponents({ frontEndComponentService }: Services): RequestHandler {
  return async (req, res, next) => {
    if (!req.path.match(/\/prisoner\/\w+\/image/)) {
      await frontEndComponentService
        .getComponents(['header'], res.locals.user.token)
        .then(components => {
          const { header } = components
          res.locals.feComponents = {
            header: header.html,
            cssIncludes: [...header.css],
            jsIncludes: [...header.javascript],
          }
        })
        .catch(error => logger.error(error, 'Failed to retrieve front end components'))
    }

    next()
  }
}
