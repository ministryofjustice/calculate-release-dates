import nock from 'nock'
import HmppsAuthClient from '../api/hmppsAuthClient'
import config from '../config'
import PrisonerService from './prisonerService'
import { PrisonApiUserCaseloads } from '../@types/prisonApi/prisonClientTypes'

jest.mock('../api/hmppsAuthClient')

const caseload = {
  caseLoadId: 'MDI',
} as PrisonApiUserCaseloads

describe('Prisoner service tests', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let prisonerService: PrisonerService
  let fakeApi: nock.Scope
  beforeEach(() => {
    config.apis.prisonApi.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.prisonApi.url)
    hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
    prisonerService = new PrisonerService(hmppsAuthClient)
  })
  afterEach(() => {
    nock.cleanAll()
  })

  it('Test fetching user caseloads', async () => {
    fakeApi.get(`/api/users/me/caseLoads`).reply(200, [caseload])

    const result = await prisonerService.getUsersCaseloads('user')

    expect(result).toEqual([caseload])
  })
})
