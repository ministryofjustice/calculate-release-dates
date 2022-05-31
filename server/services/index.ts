import HmppsAuthClient from '../api/hmppsAuthClient'
import TokenStore from '../api/tokenStore'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import UserService from './userService'
import PrisonerService from './prisonerService'
import EntryPointService from './entryPointService'
import ViewReleaseDatesService from './viewReleaseDatesService'
import UserInputService from './userInputService'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore())
const userService = new UserService(hmppsAuthClient)
const calculateReleaseDatesService = new CalculateReleaseDatesService()
const prisonerService = new PrisonerService(hmppsAuthClient)
const entryPointService = new EntryPointService()
const viewReleaseDatesService = new ViewReleaseDatesService()
const userInputService = new UserInputService()

export const services = {
  userService,
  prisonerService,
  calculateReleaseDatesService,
  entryPointService,
  viewReleaseDatesService,
  userInputService,
}

export type Services = typeof services
