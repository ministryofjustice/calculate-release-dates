import express from 'express'
import { ApplicationInfo } from '../applicationInfo'
import nunjucksSetup, { formatSds40Exclusion, pluraliseName } from './nunjucksSetup'

describe('nunjucksSetup', () => {
  describe('design systems params', () => {
    it('sets the correct environment for local', () => {
      checkDesignSystemParamsForEnv('LOCAL', 'local')
    })
    it('sets the correct environment for dev', () => {
      checkDesignSystemParamsForEnv('DEV', 'dev')
    })
    it('sets the correct environment for pre-prod', () => {
      checkDesignSystemParamsForEnv('PRE-PRODUCTION', 'pre')
    })
    it('sets the correct environment for prod which has no env name configured', () => {
      checkDesignSystemParamsForEnv('', 'prod')
    })
    it('defaults to prod', () => {
      checkDesignSystemParamsForEnv('foo', 'prod')
    })

    function checkDesignSystemParamsForEnv(appInfoEnvName: string, expectedEnvironment: string) {
      const testAppInfo: ApplicationInfo = {
        applicationName: 'test',
        buildNumber: '1',
        gitRef: 'long ref',
        gitShortHash: 'short ref',
        branchName: 'main',
        environmentName: appInfoEnvName,
      }
      const app = express()

      app.set('view engine', 'njk')

      nunjucksSetup(app, testAppInfo)

      expect(app.locals.hmppsDesignSystemEnvironment).toStrictEqual(expectedEnvironment)
    }
  })
  describe('pluralise name tests', () => {
    it('Names with s on the end get pluralised with apostrophe', () => {
      expect(pluraliseName('Bloggs')).toStrictEqual("Bloggs'")
    })

    it('Names without an s on the end get pluralised with apostrophe s', () => {
      expect(pluraliseName('Smith')).toStrictEqual("Smith's")
    })
  })
  describe('Return valid SDS40 exclusion titles', () => {
    it('Returns the correct title for standard exclusion', () => {
      expect(formatSds40Exclusion('DOMESTIC_ABUSE')).toStrictEqual('Domestic Abuse')
    })
    it('Returns the correct title for tranche 3 exclusion', () => {
      expect(formatSds40Exclusion('DOMESTIC_ABUSE_T3')).toStrictEqual(
        'Domestic Abuse (for prisoners in custody on or after the 16th Dec 2024)',
      )
    })
  })
})
