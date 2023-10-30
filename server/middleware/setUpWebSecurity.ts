import express, { Response, Router } from 'express'
import helmet from 'helmet'
import crypto from 'crypto'
import { IncomingMessage } from 'http'
import config from '../config'

export default function setUpWebSecurity(): Router {
  const router = express.Router()

  router.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64')
    next()
  })

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
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
            (req: IncomingMessage, res: Response) => `'nonce-${res.locals.cspNonce}'`,
            'code.jquery.com',
            "'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='",
            config.apis.frontendComponents.url,
          ],
          connectSrc: ["'self'", '*.googletagmanager.com', '*.google-analytics.com', '*.analytics.google.com'],
          styleSrc: ["'self'", config.apis.frontendComponents.url, 'code.jquery.com'],
          fontSrc: ["'self'", config.apis.frontendComponents.url],
          imgSrc: ["'self'", config.apis.frontendComponents.url, 'data:'],
          formAction: ["'self'", config.apis.digitalPrisonServices.ui_url],
        },
      },
    })
  )
  return router
}
