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

  static noOffenceDatesPage(): FullPageError {
    const error = new FullPageError(
      'This service cannot calculate release dates because the offence start date is missing.',
    )
    error.errorKey = FullPageErrorType.NO_OFFENCE_DATES
    error.status = 422
    return error
  }

  static noImprisonmentTermPage(): FullPageError {
    const error = new FullPageError(
      'This service cannot calculate release dates because the offence is missing imprisonment terms.',
    )
    error.errorKey = FullPageErrorType.NO_IMPRISONMENT_TERM_CODE
    error.status = 422
    return error
  }

  static noLicenceTermPage(): FullPageError {
    const error = new FullPageError(
      'This service cannot calculate release dates because the offence is missing a licence code.',
    )
    error.errorKey = FullPageErrorType.NO_LICENCE_TERM_CODE
    error.status = 422
    return error
  }
}

export enum FullPageErrorType {
  NOT_IN_CASELOAD,
  NO_SENTENCES,
  NO_CALCULATION_SUBMITTED,
  NOT_FOUND,
  NO_OFFENCE_DATES,
  NO_IMPRISONMENT_TERM_CODE,
  NO_LICENCE_TERM_CODE,
}
