import crypto from 'crypto'
import express, { Router, Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import config from '../config'

export default function setUpWebSecurity(): Router {
  const router = express.Router()

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  router.use((_req: Request, res: Response, next: NextFunction) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('hex')
    next()
  })
  router.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // Hash allows inline script pulled in from https://github.com/alphagov/govuk-frontend/blob/master/src/govuk/template.njk
          scriptSrc: [
            "'self'",
            '*.googletagmanager.com',
            '*.google-analytics.com',
            (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`,
            "'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='",
            config.apis.frontendComponents.url,
          ],
          connectSrc: ["'self'", '*.googletagmanager.com', '*.google-analytics.com', '*.analytics.google.com'],
          styleSrc: ["'self'", config.apis.frontendComponents.url],
          fontSrc: ["'self'", config.apis.frontendComponents.url],
          imgSrc: ["'self'", config.apis.frontendComponents.url, 'data:'],
          formAction: ["'self'", config.apis.digitalPrisonServices.ui_url, config.apis.hmppsAuth.externalUrl],
        },
      },
    }),
  )
  return router
}
