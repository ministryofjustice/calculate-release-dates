import ErrorResponse from '../@types/calculateReleaseDates/ErrorResponse'
import GovUkError from '../@types/calculateReleaseDates/GovUkError'

const errorCodeDefintions: Map<number, (e: ErrorResponse) => string> = new Map<number, (e: ErrorResponse) => string>([
  [
    1,
    (e: ErrorResponse) => {
      return `
                <p> One or more of the sentence types in this calculation is not currently supported in this service:</p>

                ${e.arguments.join('\n')}
                
                <p> If these sentences are correct, you will need to complete this calculation manually in NOMIS.</p
                `.trim()
    },
  ],
])

export function serverErrorToGovUkError(errorResponse: ErrorResponse, href: string): GovUkError[] {
  if (errorResponse.errorCode && errorCodeDefintions.has(errorResponse.errorCode)) {
    const html = errorCodeDefintions.get(errorResponse.errorCode).call(errorResponse)
    return [
      {
        html,
        text: html,
        href,
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
