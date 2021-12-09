export class FullPageError {
  errorKey: FullPageErrorType

  status: number

  static notInCaseLoadError(): FullPageError {
    return {
      errorKey: FullPageErrorType.NOT_IN_CASELOAD,
      status: 404,
    }
  }
}

export enum FullPageErrorType {
  NOT_IN_CASELOAD,
}
