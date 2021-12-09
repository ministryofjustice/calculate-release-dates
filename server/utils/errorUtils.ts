import ErrorResponse from '../@types/calculateReleaseDates/ErrorResponse'
import GovUkError from '../@types/calculateReleaseDates/GovUkError'

const errorCodeDefintions: Map<number, (e: ErrorResponse) => string> = new Map<number, (e: ErrorResponse) => string>([
  [
    1,
    (e: ErrorResponse) => {
      return `
                <br/><br/>
                ${e.arguments.join('<br/>')}<br/><br/>
                
                `.trim()
    },
  ],
])

export function serverErrorToGovUkError(errorResponse: ErrorResponse, href: string): GovUkError[] {
  if (errorResponse.errorCode && errorCodeDefintions.has(errorResponse.errorCode)) {
    const html = errorCodeDefintions.get(errorResponse.errorCode).call(this, errorResponse)
    return [
      {
        html,
        text: html,
      },
    ]
  }
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
