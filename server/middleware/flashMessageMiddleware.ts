import { RequestHandler } from 'express'

export default function checkForFlashMessages(): RequestHandler {
  return (req, res, next) => {
    if (req.method === 'GET') {
      const validationErrors = (req.flash('validationErrors') || [])[0]

      if (validationErrors) {
        res.locals.validationErrors = JSON.parse(validationErrors) as GovUkError[]
        res.locals.validationErrors = res.locals.validationErrors.map((originalError: GovUkError) => {
          const err = { ...originalError }
          if (!err.html && err.text.match(/\n/)) {
            err.html = err.text.replace(/\n/g, '<br/>')
          }
          return err
        })
      }
    }
    next()
  }
}

type GovUkError = {
  text: string
  html: string
}
