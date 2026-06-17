import { flushTelemetry, initialiseTelemetry, telemetry } from '@ministryofjustice/hmpps-azure-telemetry'
import type { RequestHandler } from 'express'
import logger from '../../logger'

initialiseTelemetry({
  serviceName: 'calculate-release-dates',
  serviceVersion: process.env.BUILD_NUMBER || 'unknown',
  connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  debug: process.env.DEBUG_TELEMETRY === 'true',
})
  .addFilter(
    telemetry.processors.filterSpanWherePath(['/health', '/ping', '/info', '/assets/*', '/favicon.ico', '/metrics']),
  )
  .addModifier(telemetry.processors.enrichSpanNameWithHttpRoute())
  .startRecording()

const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down...`)
  await flushTelemetry()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

export default function addUsernameAndCaseloadToTelemetry(): RequestHandler {
  return (req, res, next) => {
    const { username } = res?.locals?.user || {}
    const caseloadId = req?.prisoner?.agencyId || null

    telemetry.setSpanAttributes({
      ...(username && { username }),
      ...(caseloadId && { caseloadId }),
    })
    return next()
  }
}
