import { RequestHandler } from 'express'
import GovUkError from '../@types/calculateReleaseDates/GovUkError'

export default function checkForFlashMessages(): RequestHandler {
  return (req, res, next) => {
    if (req.method === 'GET') {
      const validationErrors = (req.flash('validationErrors') || [])[0]

      if (validationErrors) {
        res.locals.validationErrors = JSON.parse(validationErrors) as GovUkError[]
      }
    }
    next()
  }
}
