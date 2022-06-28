import ErrorMessage from './ErrorMessage'

export interface ErrorMessages {
  messages: ErrorMessage[]
  messageType?: ErrorMessageType
}

export enum ErrorMessageType {
  VALIDATION = 'VALIDATION',
  UNSUPPORTED = 'UNSUPPORTED',
  SAVE_DATES = 'SAVE_DATES',
  MISSING_PRISON_API_DATA = 'MISSING_PRISON_API_DATA',
  USER_FORM_ERROR = 'USER_FORM_ERROR',
}
