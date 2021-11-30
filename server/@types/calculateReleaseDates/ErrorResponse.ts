type ErrorResponse = {
  status: number
  errorCode?: number
  userMessage?: string
  developerMessage?: string
  moreInfo?: string
  arguments?: string[]
}

export default ErrorResponse
