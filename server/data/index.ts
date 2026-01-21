/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { AuthenticationClient, InMemoryTokenStore, RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import { buildAppInsightsClient, initialiseAppInsights } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'
import ManageUsersApiClient from './manageUsersApiClient'
import { createRedisClient } from './redisClient'
import config from '../config'
import logger from '../../logger'
import PrisonApiClient from './prisonApiClient'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
buildAppInsightsClient(applicationInfo)

const hmppsAuthClient = new AuthenticationClient(
  config.apis.hmppsAuth,
  logger,
  config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore(),
)

const dataAccess = () => ({
  applicationInfo,
  hmppsAuthClient,
  manageUsersApiClient: new ManageUsersApiClient(hmppsAuthClient),
  prisonApiClient: new PrisonApiClient(hmppsAuthClient),
})

export default dataAccess
