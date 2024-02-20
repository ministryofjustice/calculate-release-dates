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
