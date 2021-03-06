import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export class FullPageError extends Error {
  errorKey: FullPageErrorType

  status: number

  nomsId?: string

  prisonerDetails?: PrisonApiPrisoner

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
}

export enum FullPageErrorType {
  NOT_IN_CASELOAD,
  NO_SENTENCES,
  NO_CALCULATION_SUBMITTED,
  NOT_FOUND,
}
