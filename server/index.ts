import createApp from './app'
import HmppsAuthClient from './data/hmppsAuthClient'
import TokenStore from './data/tokenStore'
import UserService from './services/userService'
import CalculateReleaseDatesApiClient from './data/calculateReleaseDatesApiClient'
import CalculateReleaseDatesService from './services/calculateReleaseDatesService'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore())
const calculateReleaseDatesApiClient = new CalculateReleaseDatesApiClient()
const userService = new UserService(hmppsAuthClient)
const calculateReleaseDateService = new CalculateReleaseDatesService(calculateReleaseDatesApiClient)

const app = createApp(userService, calculateReleaseDateService)

export default app
