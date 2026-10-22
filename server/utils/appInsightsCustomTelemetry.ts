import { telemetry } from '@ministryofjustice/hmpps-azure-telemetry'
import type { RequestHandler } from 'express'
import { jwtDecode } from 'jwt-decode'

function getUserUuid(token?: string): string | undefined {
  if (!token) return undefined
  try {
    return (jwtDecode(token) as { user_uuid?: string }).user_uuid
  } catch {
    return undefined
  }
}

export default function addUsernameAndCaseloadToTelemetry(): RequestHandler {
  return (req, res, next) => {
    const { username, token } = res?.locals?.user || {}
    const userUuid = getUserUuid(token)
    const caseloadId = req?.prisoner?.agencyId || null

    telemetry.setSpanAttributes({
      ...(username && { username }),
      ...(userUuid && { user_uuid: userUuid }),
      ...(caseloadId && { caseloadId }),
    })
    return next()
  }
}
