import * as cheerio from 'cheerio'

export function expectMiniProfile(
  html: string,
  prisoner: { name: string; dob: string; prisonNumber: string; establishment: string; location: string },
) {
  const $ = cheerio.load(html)
  expect($('[data-qa=mini-profile-name]').text()).toStrictEqual(prisoner.name)
  expect($('[data-qa=mini-profile-dob]').text()).toStrictEqual(prisoner.dob)
  expect($('[data-qa=mini-profile-offender-no]').text()).toStrictEqual(prisoner.prisonNumber)
  expect($('[data-qa=mini-profile-establishment]').text()).toStrictEqual(prisoner.establishment)
  expect($('[data-qa=mini-profile-location]').text()).toStrictEqual(prisoner.location)
}

export function expectMiniProfileNoLocation(
  html: string,
  prisoner: { name: string; dob: string; prisonNumber: string; establishment?: string; location?: string },
) {
  const $ = cheerio.load(html)
  expect($('[data-qa=mini-profile-name]').text()).toStrictEqual(prisoner.name)
  expect($('[data-qa=mini-profile-dob]').text()).toStrictEqual(prisoner.dob)
  expect($('[data-qa=mini-profile-offender-no]').text()).toStrictEqual(prisoner.prisonNumber)
}

export function expectNoMiniProfile(html: string) {
  const $ = cheerio.load(html)
  expect($('[data-qa=mini-profile-name]').length).toStrictEqual(0)
}

export function expectServiceHeaderForPrisoner(html: string, prisonNumber: string) {
  expect(getServiceHeader(html)).toStrictEqual({
    text: 'Court cases and release dates',
    href: `https://custody-manager.hmpps.service.justice.gov.uk/prisoner/${prisonNumber}/overview`,
  })
}

export function expectServiceHeader(html: string) {
  expect(getServiceHeader(html)).toStrictEqual({
    text: 'Court cases and release dates',
    href: 'https://custody-manager.hmpps.service.justice.gov.uk',
  })
}

function getServiceHeader(html: string): { text: string; href: string } {
  const $ = cheerio.load(html)

  const serviceHeader = $('.service-header')
    .map((i, card) => {
      return {
        text: $(card).find('a').text(),
        href: $(card).find('a').attr('href'),
      }
    })
    .get()
  expect(serviceHeader.length).toStrictEqual(1)
  return serviceHeader[0]
}
