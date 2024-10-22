import { convertToTitleCase, initialiseName, createSupportLink } from './utils'

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('createSupportLink', () => {
  it.each([
    [
      'No subject or prefix/suffix',
      { linkText: 'contact the team' },
      '<a href="mailto:omu.specialistsupportteam@justice.gov.uk">contact the team</a>',
    ],
    [
      'With subject text',
      { linkText: 'contact the team', emailSubjectText: 'Page not found' },
      '<a href="mailto:omu.specialistsupportteam@justice.gov.uk?subject=Page%20not%20found">contact the team</a>',
    ],
    [
      'With subject and prefix',
      {
        prefixText: 'If you need help, ',
        linkText: 'contact the team',
        emailSubjectText: 'Calculate release dates - Manual entry - Incompatible dates',
      },
      'If you need help, <a href="mailto:omu.specialistsupportteam@justice.gov.uk?subject=Calculate%20release%20dates%20-%20Manual%20entry%20-%20Incompatible%20dates">contact the team</a>',
    ],
    [
      'With subject, prefix, and suffix',
      {
        prefixText: 'If you need help, ',
        linkText: 'contact the team',
        emailSubjectText: 'Calculate release dates - Manual entry - Incompatible dates',
        suffixText: ' for support.',
      },
      'If you need help, <a href="mailto:omu.specialistsupportteam@justice.gov.uk?subject=Calculate%20release%20dates%20-%20Manual%20entry%20-%20Incompatible%20dates">contact the team</a> for support.',
    ],
    [
      'With different email',
      {
        emailAddress: 'calculatereleasedates@digital.justice.gov.uk',
        linkText: 'contact Calculate release dates team',
      },
      '<a href="mailto:calculatereleasedates@digital.justice.gov.uk">contact Calculate release dates team</a>',
    ],
  ])('%s', (_, options, expected) => {
    expect(createSupportLink(options)).toEqual(expected)
  })
})
