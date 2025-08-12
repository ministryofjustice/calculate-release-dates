import type { ResponseError } from 'superagent'

export interface SanitisedError extends Error {
  text?: string
  status?: number
  headers?: unknown
  data?: unknown
  stack: string
  message: string
}

export type UnsanitisedError = ResponseError

export default function sanitise(error: UnsanitisedError): SanitisedError {
  const e = new Error() as SanitisedError
  e.message = error.message
  e.stack = error.stack
  if (error.response) {
    e.text = error.response.text
    e.status = error.response.status
    e.headers = error.response.headers
    e.data = error.response.body
  }
  return e
}

export type SanitisedDataResponse = SanitisedError & {
  data: {
    userMessage: string
  }
}

export function isDataError(value: unknown): value is SanitisedDataResponse {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return typeof obj.data === 'object' && Object.prototype.hasOwnProperty.call(obj.data, 'userMessage')
}
