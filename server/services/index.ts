import HmppsAuthClient from '../api/hmppsAuthClient'
import TokenStore from '../api/tokenStore'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import UserService from './userService'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore())
const userService = new UserService(hmppsAuthClient)
const calculateReleaseDatesService = new CalculateReleaseDatesService(hmppsAuthClient)

export const services = {
  userService,
  calculateReleaseDatesService,
}

export type Services = typeof services
