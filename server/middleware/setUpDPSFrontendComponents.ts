import {RequestHandler} from 'express'
import {Services} from "../services";
import logger from "../../logger";

export default function setUpFrontendComponents({ dpsFront }: Services): RequestHandler {
  return async (req, res, next) => {
    try {
      const { header, footer } = await componentService.getComponents(['header', 'footer'], res.locals.user.token)

      res.locals.feComponents = {
        header: header.html,
        footer: footer.html,
        cssIncludes: [...header.css, ...footer.css],
        jsIncludes: [...header.javascript, ...footer.javascript],
      }
      next()
    } catch (error) {
      logger.error(error, 'Failed to retrieve front end components')
      next()
    }
  }
}
