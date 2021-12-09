export class FullPageError {
  errorKey: FullPageErrorType

  status: number

  static notInCaseLoadError(): FullPageError {
    return {
      errorKey: FullPageErrorType.NOT_IN_CASELOAD,
      status: 404,
    }
  }

  static noSentences(): FullPageError {
    return {
      errorKey: FullPageErrorType.NO_SENTENCES,
      status: 400,
    }
  }
}

export enum FullPageErrorType {
  NOT_IN_CASELOAD,
  NO_SENTENCES,
}
