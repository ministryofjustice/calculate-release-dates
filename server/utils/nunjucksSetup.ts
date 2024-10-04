/* eslint-disable no-param-reassign */
import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import {
  personProfileName,
  personDateOfBirth,
  personStatus,
  hmppsFormatDate,
} from 'hmpps-court-cases-release-dates-design/hmpps/utils/utils'
import dateFilter from 'nunjucks-date-filter'
import { hmppsDesignSystemsEnvironmentName, initialiseName } from './utils'
import { ApplicationInfo } from '../applicationInfo'
import config from '../config'
import ComparisonType from '../enumerations/comparisonType'
import { FieldValidationError } from '../types/FieldValidationError'

// TODO the use of nunjucks-date-filter is raising a deprecation warning, some dates are in this format 12/12/2030 ->
// Deprecation warning: value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), which is not reliable
// across all browsers and versions. Non RFC2822/ISO date formats are discouraged.

const production = process.env.NODE_ENV === 'production'

let njkEnv: nunjucks.Environment

export function nunjucksEnv(): nunjucks.Environment {
  return njkEnv
}

export default function nunjucksSetup(app: express.Express, applicationInfo: ApplicationInfo): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Calculate release dates'
  app.locals.environmentName = applicationInfo.environmentName
  app.locals.environmentNameColour = applicationInfo.environmentName === 'PRE-PRODUCTION' ? 'govuk-tag--green' : ''
  app.locals.hmppsDesignSystemEnvironment = hmppsDesignSystemsEnvironmentName(applicationInfo.environmentName)
  app.locals.appInsightsConnectionString = config.appInsightsConnectionString
  app.locals.appInsightsApplicationName = applicationInfo.applicationName
  app.locals.buildNumber = config.buildNumber

  // Cache-busting version string
  if (production) {
    // Version only changes with new commits
    app.locals.version = applicationInfo.gitShortHash
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
      'node_modules/govuk-frontend/dist/',
      'node_modules/govuk-frontend/dist/components/',
      'node_modules/@ministryofjustice/frontend/',
      'node_modules/@ministryofjustice/frontend/moj/components/',
      'node_modules/hmpps-court-cases-release-dates-design/',
      'node_modules/hmpps-court-cases-release-dates-design/hmpps/components/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )

  // Expose the google tag manager container ID to the nunjucks environment
  const {
    analytics: { tagManagerContainerId },
  } = config

  njkEnv.addGlobal('tagManagerContainerId', tagManagerContainerId)
  njkEnv.addGlobal('authUrl', config.apis.hmppsAuth.url)
  njkEnv.addGlobal('featureToggles', config.featureToggles)
  njkEnv.addGlobal('digitalPrisonServicesUrl', config.apis.digitalPrisonServices.ui_url)
  njkEnv.addGlobal('courtCasesAndReleaseDatesUrl', config.apis.courtCasesAndReleaseDatesUi.url)
  njkEnv.addGlobal('ComparisonType', ComparisonType)

  njkEnv.addFilter('initialiseName', initialiseName)

  njkEnv.addFilter('formatListAsString', (list?: string[]) => {
    return list ? `[${list.map(i => `'${i}'`).join(',')}]` : '[]'
  })

  njkEnv.addFilter('date', dateFilter)

  njkEnv.addFilter('pluralise', (word, number, appender) => (number === 1 ? word : `${word}${appender || 's'}`))

  njkEnv.addFilter('pluraliseName', name => pluraliseName(name))

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

  njkEnv.addFilter('formatCurrency', currency => {
    return typeof currency === 'number'
      ? currency.toLocaleString(undefined, { style: 'currency', currency: 'GBP' })
      : ''
  })

  njkEnv.addFilter('formatComparisonType', comparisonType => {
    return formatComparisonType(comparisonType)
  })

  njkEnv.addFilter('errorSummaryList', (array = []) => {
    return array.map((error: FieldValidationError) => ({
      text: error.message,
      href: `#${error.field}`,
    }))
  })

  // eslint-disable-next-line no-use-before-define,default-param-last
  njkEnv.addFilter('findError', (array: FieldValidationError[] = [], formFieldId: string) => {
    const item = array.find(error => error.field === formFieldId)
    if (item) {
      return {
        text: item.message,
      }
    }
    return null
  })

  njkEnv.addFilter('personProfileName', personProfileName)
  njkEnv.addFilter('personDateOfBirth', personDateOfBirth)
  njkEnv.addFilter('personStatus', personStatus)
  njkEnv.addFilter('hmppsFormatDate', hmppsFormatDate)
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
  const mtd = dates.MTD
  if (mtd) {
    return 'MTD'
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

const formatComparisonType = (comparisonType: ComparisonType) => {
  switch (comparisonType) {
    case ComparisonType.ESTABLISHMENT_FULL:
      return 'Full'
    case ComparisonType.MANUAL:
      return 'Manual'
    default:
      throw Error(`Comparison type ${comparisonType} not recognised`)
  }
}

export const pluraliseName = (name: string) => {
  if (name.endsWith('s')) {
    return `${name}'`
  }
  return `${name}'s`
}
