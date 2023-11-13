import superagent from 'superagent'
import querystring from 'querystring'
import type TokenStore from './tokenStore'

import logger from '../../logger'
import config from '../config'
import generateOauthClientToken from '../authentication/clientCredentials'

const timeoutSpec = config.apis.hmppsAuth.timeout
const hmppsAuthUrl = config.apis.hmppsAuth.url

function getSystemClientTokenFromHmppsAuth(username?: string): Promise<superagent.Response> {
  const clientToken = generateOauthClientToken(
    config.apis.hmppsAuth.systemClientId,
    config.apis.hmppsAuth.systemClientSecret
  )

  const authRequest = username
    ? querystring.stringify({ grant_type: 'client_credentials', username })
    : querystring.stringify({ grant_type: 'client_credentials' })

  logger.info(
    `HMPPS Auth request '${authRequest}' for client id '${config.apis.hmppsAuth.systemClientId}' and user '${username}'`
  )

  return superagent
    .post(`${hmppsAuthUrl}/oauth/token`)
    .set('Authorization', clientToken)
    .set('content-type', 'application/x-www-form-urlencoded')
    .send(authRequest)
    .timeout(timeoutSpec)
}
export default class HmppsAuthClient {
  constructor(private readonly tokenStore: TokenStore) {
    // intentionally left blank
  }

  async getSystemClientToken(username?: string): Promise<string> {
    const key = username || '%ANONYMOUS%'

    const token = await this.tokenStore.getToken(key)
    if (token) {
      return token
    }

    const newToken = await getSystemClientTokenFromHmppsAuth(username)

    // set TTL slightly less than expiry of token. Async but no need to wait
    await this.tokenStore.setToken(key, newToken.body.access_token, newToken.body.expires_in - 60)

    return newToken.body.access_token
  }
}
