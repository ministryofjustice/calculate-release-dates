export class FullPageError extends Error {
  errorKey: FullPageErrorType

  status: number;

  [key: string]: any

  static notInCaseLoadError(): FullPageError {
    const error = new FullPageError('Prisoner is in caseload')
    error.errorKey = FullPageErrorType.NOT_IN_CASELOAD
    error.status = 404
    return error
  }

  static noSentences(): FullPageError {
    const error = new FullPageError('Prisoner has no sentences')
    error.errorKey = FullPageErrorType.NO_SENTENCES
    error.status = 400
    return error
  }
}

export enum FullPageErrorType {
  NOT_IN_CASELOAD,
  NO_SENTENCES,
}
