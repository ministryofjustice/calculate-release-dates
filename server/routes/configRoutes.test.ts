import request from 'supertest'
import { Express } from 'express'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import { PrisonApiPrison } from '../@types/prisonApi/prisonClientTypes'
import UserPermissionsService from '../services/userPermissionsService'

jest.mock('../services/prisonerService')
jest.mock('../services/userPermissionsService')
const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const userPermissionsService = new UserPermissionsService() as jest.Mocked<UserPermissionsService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: { prisonerService, userPermissionsService },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

const allPrisons = [
  {
    agencyId: 'ALI',
    description: 'Albany (HMP)',
    longDescription: 'HMP ALBANY',
    agencyType: 'INST',
    active: true,
  },
  {
    agencyId: 'ACI',
    description: 'Altcourse (HMP)',
    longDescription: 'HMP ALTCOURSE',
    agencyType: 'INST',
    active: true,
  },
  {
    agencyId: 'ASI',
    description: 'Ashfield (HMP)',
    longDescription: 'HMP & YOI ASHFIELD',
    agencyType: 'INST',
    active: true,
  },
  {
    agencyId: 'AYI',
    description: 'Aylesbury (HMP)',
    longDescription: 'HMP AYLESBURY',
    agencyType: 'INST',
    active: true,
  },
  {
    agencyId: 'BFI',
    description: 'Bedford (HMP)',
    longDescription: 'HMP BEDFORD',
    agencyType: 'INST',
    active: true,
  },
] as PrisonApiPrison[]

describe('Compare routes tests', () => {
  it('GET /config should return to the search if the user does not have the correct role', () => {
    prisonerService.getActivePrisons.mockResolvedValue(allPrisons)
    prisonerService.getPrisonsWithServiceCode.mockResolvedValue([])
    userPermissionsService.allowNomisReadOnlyScreensConfigurationAccess.mockReturnValue(false)

    return request(app).get('/config').expect(302).expect('Location', '/search/prisoners')
  })

  it('GET /config should show the page with all the active prisons the user has the correct role', () => {
    userPermissionsService.allowNomisReadOnlyScreensConfigurationAccess.mockReturnValue(true)
    prisonerService.getActivePrisons.mockResolvedValue(allPrisons)
    prisonerService.getPrisonsWithServiceCode.mockResolvedValue([])

    return request(app)
      .get('/config')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Select the status of the Adjustments screen')
        expect(res.text).toContain('Checked prisons are read only')
        expect(res.text).toContain('Altcourse (HMP)')
        expect(res.text).toContain('Ashfield (HMP)')
        expect(res.text).toContain('Aylesbury (HMP)')
        expect(res.text).toContain('Albany (HMP)')
        expect(res.text).toContain('Bedford (HMP)')
      })
  })

  it('POST /config for an unchecked prison results in call to the api to enable it', () => {
    prisonerService.getActivePrisons.mockResolvedValue(allPrisons)
    prisonerService.getPrisonsWithServiceCode.mockResolvedValue([])

    return request(app)
      .post('/config')
      .type('form')
      .send({ apiId: 'ADJUSTMENTS', checkedBoxes: 'BFI' })
      .expect(res => {
        expect(prisonerService.postServiceCodeForPrison).toHaveBeenCalledTimes(1)
        expect(prisonerService.postServiceCodeForPrison).toHaveBeenCalledWith('ADJUSTMENTS', 'BFI')
        expect(prisonerService.deleteServiceCodeForPrison).toHaveBeenCalledTimes(0)
      })
  })

  it('POST /config for unchecking a checked prison results in call to the api to disable it', () => {
    prisonerService.getActivePrisons.mockResolvedValue(allPrisons)
    prisonerService.getPrisonsWithServiceCode.mockResolvedValue([{ prisonId: 'BFI', prison: 'Bedford (HMP)' }])

    return request(app)
      .post('/config')
      .type('form')
      .send({ apiId: 'ADJUSTMENTS' })
      .expect(res => {
        expect(prisonerService.postServiceCodeForPrison).toHaveBeenCalledTimes(0)
        expect(prisonerService.deleteServiceCodeForPrison).toHaveBeenCalledTimes(1)
        expect(prisonerService.deleteServiceCodeForPrison).toHaveBeenCalledWith('ADJUSTMENTS', 'BFI')
      })
  })
})
