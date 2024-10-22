import { createSupportLink } from '../utils/utils'

const illegalPairs: Pair[] = [
  {
    left: 'CRD',
    right: 'ARD',
  },
  {
    left: 'HDCED',
    right: 'PRRD',
  },
  {
    left: 'HDCAD',
    right: 'PRRD',
  },
  {
    left: 'PED',
    right: 'PRRD',
  },
  {
    left: 'HDCED',
    right: 'PED',
  },
  {
    left: 'HDCAD',
    right: 'PED',
  },
  {
    left: 'HDCAD',
    right: 'APD',
  },
  {
    left: 'TUSED',
    right: 'PED',
  },
  {
    left: 'ARD',
    right: 'LED',
  } as Pair,
]
const errorStart = 'The following release dates cannot be selected together:'
const errorEnd = createSupportLink({
  prefixText: 'You must reselect the dates, or if you need help, ',
  linkText: 'contact the Specialist support team',
  suffixText: ' for support.',
  emailSubjectText: 'Calculate release dates - Manual Entry - Incompatible Dates',
})

export default class ManualEntryValidationService {
  public validatePairs(dates: string[]): string {
    if (dates === null || dates === undefined) {
      return undefined
    }
    const foundPairs = illegalPairs.filter(pair => dates.includes(pair.left) && dates.includes(pair.right))
    if (foundPairs.length === 0) {
      return undefined
    }
    const errorStrings = foundPairs.map(pair => `<li>${pair.left} and ${pair.right}</li>`).join('\n')
    return `<div class="govuk-error-message">${errorStart}<ul>${errorStrings}</ul>${errorEnd}</div>`
  }
}

export interface Pair {
  left: string
  right: string
}
