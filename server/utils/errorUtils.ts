import ErrorResponse from '../@types/calculateReleaseDates/ErrorResponse'
import GovUkError from '../@types/calculateReleaseDates/GovUkError'

export function serverErrorToGovUkError(errorResponse: ErrorResponse, href: string): GovUkError[] {
  return [
    {
      text: errorResponse.userMessage,
      href,
    },
  ]
}

export function validationError(text: string, href: string): GovUkError[] {
  return [
    {
      text,
      href,
    },
  ]
}
