import HmppsAuthClient from '../api/hmppsAuthClient'
import TokenStore from '../api/tokenStore'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import UserService from './userService'
import PrisonerService from './prisonerService'
import EntryPointService from './entryPointService'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore())
const userService = new UserService(hmppsAuthClient)
const calculateReleaseDatesService = new CalculateReleaseDatesService(hmppsAuthClient)
const prisonerService = new PrisonerService(hmppsAuthClient)
const entryPointService = new EntryPointService()

export const services = {
  userService,
  prisonerService,
  calculateReleaseDatesService,
  entryPointService,
}

export type Services = typeof services
