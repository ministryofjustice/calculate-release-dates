/* eslint-disable no-param-reassign */
import nunjucks from 'nunjucks'
import express from 'express'
import * as pathModule from 'path'
import config from '../config'

// TODO the use of nunjucks-date-filter is raising a deprecation warning, some dates are in this format 12/12/2030 ->
// Deprecation warning: value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), which is not reliable
// across all browsers and versions. Non RFC2822/ISO date formats are discouraged.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dateFilter = require('nunjucks-date-filter')

const production = process.env.NODE_ENV === 'production'

let njkEnv: nunjucks.Environment

export function nunjucksEnv(): nunjucks.Environment {
  return njkEnv
}

export default function nunjucksSetup(app: express.Express, path: pathModule.PlatformPath): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Calculate release dates'

  // Cachebusting version string
  if (production) {
    // Version only changes on reboot
    app.locals.version = Date.now().toString()
  } else {
    // Version changes every request
    app.use((req, res, next) => {
      res.locals.version = Date.now().toString()
      return next()
    })
  }

  njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/',
      'node_modules/govuk-frontend/components/',
      'node_modules/@ministryofjustice/frontend/',
      'node_modules/@ministryofjustice/frontend/moj/components/',
    ],
    {
      autoescape: true,
      express: app,
    }
  )

  // Expose the google tag manager container ID to the nunjucks environment
  const {
    analytics: { tagManagerContainerId },
  } = config

  njkEnv.addGlobal('tagManagerContainerId', tagManagerContainerId)
  njkEnv.addGlobal('authUrl', config.apis.hmppsAuth.url)
  njkEnv.addGlobal('featureToggles', config.featureToggles)
  njkEnv.addGlobal('digitalPrisonServicesUrl', config.apis.digitalPrisonServices.ui_url)

  njkEnv.addFilter('initialiseName', (fullName: string) => {
    // this check is for the authError page
    if (!fullName) {
      return null
    }
    const array = fullName.split(' ')
    return `${array[0][0]}. ${array.reverse()[0]}`
  })

  njkEnv.addFilter('formatListAsString', (list?: string[]) => {
    return list ? `[${list.map(i => `'${i}'`).join(',')}]` : '[]'
  })

  njkEnv.addFilter('date', dateFilter)

  njkEnv.addFilter('pluralise', (word, number, appender) => (number === 1 ? word : `${word}${appender || 's'}`))

  njkEnv.addFilter('releaseDates', dates => {
    return dates[getReleaseDateType(dates)]
  })

  njkEnv.addFilter('expiryDates', dates => {
    return dates[getExpiryDateType(dates)]
  })

  njkEnv.addFilter('releaseDateType', dates => {
    return getReleaseDateType(dates)
  })

  njkEnv.addFilter('expiryDateType', dates => {
    return getExpiryDateType(dates)
  })
}

const getReleaseDateType = (dates: { [key: string]: unknown }): string => {
  const crd = dates.CRD
  if (crd) {
    return 'CRD'
  }
  const ard = dates.ARD
  if (ard) {
    return 'ARD'
  }
  const prrd = dates.PRRD
  if (prrd) {
    return 'PRRD'
  }
  throw Error(`Couldn't find release date from dates map ${Object.keys(dates)}`)
}

const getExpiryDateType = (dates: { [key: string]: unknown }): string => {
  const sled = dates.SLED
  if (sled) {
    return 'SLED'
  }
  const sed = dates.SED
  if (sed) {
    return 'SED'
  }
  throw Error(`Couldn't find expiry date from dates map ${Object.keys(dates)}`)
}
