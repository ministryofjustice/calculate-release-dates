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
const errorEnd =
  'Reselect your dates or <a href="mailto:calculatereleasedates@digital.justice.gov.uk?subject=Calculate%20release%20dates%20-%20Support">contact the Calculate release dates team</a> for support.'
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
