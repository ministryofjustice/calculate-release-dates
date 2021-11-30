type ErrorResponse = {
  status: number
  errorCode?: number
  userMessage?: string
  developerMessage?: string
  moreInfo?: string
}

export default ErrorResponse
