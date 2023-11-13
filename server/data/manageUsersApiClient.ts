import RestClient from './restClient'
import config from '../config'
import logger from '../../logger'

export interface User {
  username: string
  name?: string
  active?: boolean
  authSource?: string
  uuid?: string
  userId?: string
  staffId?: number // deprecated, use userId
  activeCaseLoadId?: string // deprecated, use user roles api
}

export interface UserRole {
  roleCode: string
}

export default class ManageUsersApiClient {
  private static restClient(token: string): RestClient {
    return new RestClient('Manage Users Api Client', config.apis.manageUsersApi, token)
  }

  getUser(token: string): Promise<User> {
    logger.info('Getting user details: calling HMPPS Manage Users Api')
    return ManageUsersApiClient.restClient(token).get({ path: '/users/me' }) as Promise<User>
  }

  getUserRoles(token: string): Promise<string[]> {
    return ManageUsersApiClient.restClient(token)
      .get({ path: '/users/me/roles' })
      .then(roles => (<UserRole[]>roles).map(role => role.roleCode))
  }
}
