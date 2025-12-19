import express from 'express'
import { ApplicationInfo } from '../applicationInfo'
import nunjucksSetup, {
  formatFtr56Tranche,
  formatSds40Exclusion,
  latestRevocationDate,
  pluraliseName,
  trancheIsFtr56,
} from './nunjucksSetup'

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
      expect(formatSds40Exclusion('SEXUAL')).toStrictEqual('Sexual')
      expect(formatSds40Exclusion('MURDER')).toStrictEqual('Murder')
    })
    it('Returns the correct title for tranche 3 exclusion', () => {
      expect(formatSds40Exclusion('DOMESTIC_ABUSE_T3')).toStrictEqual(
        'Domestic Abuse (for prisoners in custody on or after the 16th Dec 2024)',
      )
      expect(formatSds40Exclusion('SEXUAL_T3')).toStrictEqual(
        'Sexual (for prisoners in custody on or after the 16th Dec 2024)',
      )
      expect(formatSds40Exclusion('MURDER_T3')).toStrictEqual(
        'Murder (for prisoners in custody on or after the 16th Dec 2024)',
      )
    })
  })
  describe('latestRevocationDate', () => {
    it('returns the latest date from a list of ISO date strings', () => {
      const dates = ['2023-01-01', '2024-05-10', '2022-12-31']
      expect(latestRevocationDate(dates)).toEqual(new Date('2024-05-10'))
    })
    it('returns the latest date from a list with different formats', () => {
      const dates = ['2023/01/01', '2024-05-10', '2022-12-31']
      expect(latestRevocationDate(dates)).toEqual(new Date('2024-05-10'))
    })
    it('returns null for an empty array', () => {
      expect(latestRevocationDate([])).toBe(null)
    })
  })
  describe('trancheIsFtr56 and formatFtr56Tranche', () => {
    describe('trancheIsFtr56', () => {
      it('returns true for valid FTR 56 tranches', () => {
        expect(trancheIsFtr56('FTR_56_TRANCHE_1')).toBe(true)
        expect(trancheIsFtr56('FTR_56_TRANCHE_6')).toBe(true)
      })
      it('returns false for invalid tranches', () => {
        expect(trancheIsFtr56('FTR_56_TRANCHE_7')).toBe(false)
        expect(trancheIsFtr56('OTHER_TRANCHE')).toBe(false)
        expect(trancheIsFtr56('')).toBe(false)
      })
    })
    describe('formatFtr56Tranche', () => {
      it('returns the correct tranche label', () => {
        expect(formatFtr56Tranche('FTR_56_TRANCHE_1')).toBe('Tranche 1')
        expect(formatFtr56Tranche('FTR_56_TRANCHE_5')).toBe('Tranche 5')
      })
      it('returns the last character as tranche number', () => {
        expect(formatFtr56Tranche('SOME_TRANCHE_3')).toBe('Tranche 3')
      })
    })
  })
})
