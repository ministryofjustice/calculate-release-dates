import { telemetry } from '@ministryofjustice/hmpps-azure-telemetry'
import type { RequestHandler } from 'express'

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
