/* eslint-disable no-param-reassign */
import nunjucks from 'nunjucks'
import express from 'express'
import * as pathModule from 'path'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import config from '../config'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const dateFilter = require('nunjucks-date-filter')

const production = process.env.NODE_ENV === 'production'

let njkEnv: nunjucks.Environment

export function nunjucksEnv() {
  return njkEnv
}

export default function nunjucksSetup(app: express.Express, path: pathModule.PlatformPath): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Calculate Release Dates'

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

  njkEnv.addFilter('countOffences', sentencesAndOffences => {
    const reducer = (previousValue: number, currentValue: PrisonApiOffenderSentenceAndOffences) =>
      previousValue + currentValue.offences.length
    return sentencesAndOffences.reduce(reducer, 0)
  })

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
