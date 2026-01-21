import nock from 'nock'
import request from 'supertest'
import { Express } from 'express'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import {
  CalculationSentenceUserInput,
  CalculationUserInputs,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ViewReleaseDatesService from './viewReleaseDatesService'
import { FullPageError } from '../types/FullPageError'
import PrisonerService from './prisonerService'
import { appWithAllRoutes } from '../routes/testutils/appSetup'
import SessionSetup from '../routes/testutils/sessionSetup'
import PrisonApiClient from '../data/prisonApiClient'

let app: Express
let sessionSetup: SessionSetup
jest.mock('../data/hmppsAuthClient')
jest.mock('./prisonerService') // Mock the PrisonerService module

const token = 'token'
const stubbedUserInput = {
  sentenceCalculationUserInputs: [
    {
      userInputType: 'ORIGINAL',
      userChoice: true,
      offenceCode: '123',
      sentenceSequence: 2,
    } as CalculationSentenceUserInput,
  ],
} as CalculationUserInputs
describe('View release dates service tests', () => {
  let viewReleaseDatesService: ViewReleaseDatesService
  let fakeApi: nock.Scope
  let hmppsAuthClient: jest.Mocked<AuthenticationClient>
  let prisonApiClient: jest.Mocked<PrisonApiClient>
  let prisonerService: jest.Mocked<PrisonerService>
  beforeEach(() => {
    sessionSetup = new SessionSetup()
    config.apis.calculateReleaseDates.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.calculateReleaseDates.url)
    viewReleaseDatesService = new ViewReleaseDatesService()
    hmppsAuthClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>

    prisonApiClient = new PrisonApiClient(null) as jest.Mocked<PrisonApiClient>
    prisonerService = new PrisonerService(hmppsAuthClient, prisonApiClient) as jest.Mocked<PrisonerService> // Instantiate the mocked service
    app = appWithAllRoutes({
      services: { prisonerService },
      sessionSetup,
    })
  })
  afterEach(() => {
    nock.cleanAll()
  })

  describe('Check access tests', () => {
    const runTest = async routes => {
      await Promise.all(
        routes.map(route =>
          request(app)
            [route.method.toLowerCase()](route.url)
            .expect(404)
            .expect('Content-Type', /html/)
            .expect(res => {
              expect(res.text).toContain('The details for this person cannot be found')
            }),
        ),
      )
    }

    it('Check urls no access when not in caseload', async () => {
      prisonerService.getPrisonerDetail.mockImplementation(() => {
        throw FullPageError.notInCaseLoadError()
      })
      prisonerService.checkPrisonerAccess.mockImplementation(() => {
        throw FullPageError.notInCaseLoadError()
      })

      const routes = [
        { method: 'GET', url: '/view/A1234AA/latest' },
        { method: 'GET', url: '/view/A1234AA/sentences-and-offences/123456' },
        { method: 'GET', url: '/view/A1234AA/nomis-calculation-summary/123456' },
        { method: 'GET', url: '/view/A1234AA/nomis-calculation-summary/123456' },
        { method: 'GET', url: '/view/A1234AA/calculation-summary/123456' },
        { method: 'GET', url: '/view/A1234AA/calculation-summary/123456/print' },
        { method: 'GET', url: '/view/A1234AA/calculation-summary/123456/printNotificationSlip' },
      ]

      await runTest(routes)
    })
  })

  describe('calculatePreliminaryReleaseDates', () => {
    it('Test the request for user inputs from a calculation', async () => {
      const calculationId = 123
      fakeApi.get(`/calculation/calculation-user-input/${calculationId}`).reply(200, stubbedUserInput)

      const result = await viewReleaseDatesService.getCalculationUserInputs(calculationId, token)

      expect(result).toEqual(stubbedUserInput)
    })
    it('The service returns null if there were no user inputs to the calculation', async () => {
      const calculationId = 123
      fakeApi.get(`/calculation/calculation-user-input/${calculationId}`).reply(404)

      const result = await viewReleaseDatesService.getCalculationUserInputs(calculationId, token)

      expect(result).toEqual(null)
    })
  })
})
