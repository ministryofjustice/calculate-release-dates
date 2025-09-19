import { RequestHandler } from 'express'

export default function populateValidationErrors(): RequestHandler {
  return async (req, res, next) => {
    const validationErrors = req.flash('validationErrors')[0]
    const formResponses = req.flash('formResponses')[0]
    if (validationErrors) {
      res.locals.validationErrors = JSON.parse(validationErrors)
    }
    if (formResponses) {
      res.locals.formResponses = JSON.parse(formResponses)
    }
    next()
  }
}
