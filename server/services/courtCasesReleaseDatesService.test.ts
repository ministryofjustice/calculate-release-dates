import nock from 'nock'
import config from '../config'
import HmppsAuthClient from '../data/hmppsAuthClient'
import CourtCasesReleaseDatesService from './courtCasesReleaseDatesService'

jest.mock('../data/hmppsAuthClient')

describe('Court Cases and Release Dates service related tests', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let courtCasesAndReleaseDatesService: CourtCasesReleaseDatesService
  let fakeApi: nock.Scope
  beforeEach(() => {
    config.apis.courtCasesReleaseDatesApi.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.courtCasesReleaseDatesApi.url)
    hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
    hmppsAuthClient.getSystemClientToken.mockResolvedValue('token')
    courtCasesAndReleaseDatesService = new CourtCasesReleaseDatesService(hmppsAuthClient)
  })
  afterEach(() => {
    nock.cleanAll()
  })

  describe('courtCasesAndReleaseDatesService', () => {
    describe('getThingsToDo', () => {
      it('Test getting of Adjustment Things to do', async () => {
        fakeApi.get(`/things-to-do/prisoner/123`).reply(200, {
          prisonerId: '123',
          calculationThingsToDo: [],
          adjustmentThingsToDo: {
            prisonerId: '123',
            thingsToDo: ['ADA_INTERCEPT'],
            adaIntercept: {
              type: 'FIRST_TIME',
              number: 1,
              anyProspective: true,
              messageArguments: [],
              message:
                'This service has identified ADA adjustments that were created in NOMIS. You must review the adjudications with ADAs and approve them in this service.',
            },
          },
          hasAdjustmentThingsToDo: true,
          hasCalculationThingsToDo: false,
        })

        const result = await courtCasesAndReleaseDatesService.getThingsToDo('123')

        expect(result.hasAdjustmentThingsToDo).toBe(true)
        expect(result.prisonerId).toBe('123')
        expect(result.adjustmentThingsToDo.thingsToDo[0]).toBe('ADA_INTERCEPT')
        expect(result.adjustmentThingsToDo.adaIntercept.type).toBe('FIRST_TIME')
        expect(result.adjustmentThingsToDo.adaIntercept.number).toBe(1)
        expect(result.adjustmentThingsToDo.adaIntercept.anyProspective).toBe(true)
        expect(result.adjustmentThingsToDo.adaIntercept.message).toBe(
          'This service has identified ADA adjustments that were created in NOMIS. You must review the adjudications with ADAs and approve them in this service.',
        )
      })
    })
  })
})
