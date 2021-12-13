import ErrorMessage from './ErrorMessage'

export interface ErrorMessages {
  messages: ErrorMessage[]
  messageType?: ErrorMessageType
}

export enum ErrorMessageType {
  VALIDATION = 'VALIDATION',
  UNSUPPORTED = 'UNSUPPORTED',
}