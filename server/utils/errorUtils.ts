import { FullPageErrorType } from '../types/FullPageError'

export default function getMissingPrisonDataError(error: string): FullPageErrorType | null {
  const errorMessage = error.toLowerCase()
  switch (true) {
    case errorMessage.startsWith('no offence end or start dates provided on charge'):
      return FullPageErrorType.NO_OFFENCE_DATES
    case errorMessage.startsWith('missing imprisonment_term_code'):
      return FullPageErrorType.NO_IMPRISONMENT_TERM_CODE
    case errorMessage.startsWith('missing licence_term_code'):
      return FullPageErrorType.NO_LICENCE_TERM_CODE
    default:
      return null
  }
}
