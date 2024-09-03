import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export class FullPageError extends Error {
  errorKey: FullPageErrorType

  status: number

  nomsId?: string

  prisonerDetails?: PrisonApiPrisoner

  static notInCaseLoadError(prisonerDetails?: PrisonApiPrisoner): FullPageError {
    const error = new FullPageError('Prisoner is not in caseload')
    error.errorKey = FullPageErrorType.NOT_IN_CASELOAD
    error.status = 404
    error.prisonerDetails = prisonerDetails
    return error
  }

  static noSentences(bookingId: number): FullPageError {
    const errorMessage = `Prisoner with booking ID ${bookingId} has no sentences`
    const error = new FullPageError(errorMessage)
    error.errorKey = FullPageErrorType.NO_SENTENCES
    error.status = 400
    return error
  }

  static noCalculationSubmitted(nomsId: string, prisonerDetails: PrisonApiPrisoner): FullPageError {
    const error = new FullPageError('Prisoner has no calculation submitted')
    error.errorKey = FullPageErrorType.NO_CALCULATION_SUBMITTED
    error.status = 404
    error.nomsId = nomsId
    error.prisonerDetails = prisonerDetails
    return error
  }

  static notFoundError(): FullPageError {
    const error = new FullPageError('Not found')
    error.errorKey = FullPageErrorType.NOT_FOUND
    error.status = 404
    return error
  }

  static couldNotLoadConfirmPage(): FullPageError {
    const error = new FullPageError('A calculation or prisoner could not be found')
    error.errorKey = FullPageErrorType.CALCULATION_OR_PRISONER_NOT_FOUND
    error.status = 404
    return error
  }

  static theDataHasChangedPage(): FullPageError {
    const error = new FullPageError(
      'The offence, sentence or adjustments data has changed since the override was requested',
    )
    error.errorKey = FullPageErrorType.DATA_CHANGED_AFTER_SUPPORT_REQUEST_RAISED
    error.status = 409
    return error
  }
}

export enum FullPageErrorType {
  NOT_IN_CASELOAD,
  NO_SENTENCES,
  NO_CALCULATION_SUBMITTED,
  NOT_FOUND,
  CALCULATION_OR_PRISONER_NOT_FOUND,
  DATA_CHANGED_AFTER_SUPPORT_REQUEST_RAISED,
}
