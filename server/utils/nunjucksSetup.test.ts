import express from 'express'
import { ApplicationInfo } from '../applicationInfo'
import nunjucksSetup from './nunjucksSetup'

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
})
