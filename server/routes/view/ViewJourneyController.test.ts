import request from 'supertest'
import type { Express } from 'express'
import PrisonerService from '../../services/prisonerService'
import UserService from '../../services/userService'
import ViewReleaseDatesService from '../../services/viewReleaseDatesService'
import {
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../../@types/prisonApi/prisonClientTypes'
import { BookingCalculation } from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import config from '../../config'
import { appWithAllRoutes } from '../testutils/appSetup'

jest.mock('../../services/prisonerService')
jest.mock('../../services/viewReleaseDatesService')

const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>
new UserService(null, prisonerService) as jest.Mocked<UserService>
const viewReleaseDatesService = new ViewReleaseDatesService(null) as jest.Mocked<ViewReleaseDatesService>

let app: Express

beforeEach(() => {
  config.featureToggles.sdsExclusionIndicatorsEnabled = false
  app = appWithAllRoutes({
    services: {
      prisonerService,
      viewReleaseDatesService,
    },
  })
})

describe('View journey controller tests', () => {
  it('GET /view/:nomsId/latest should redirect to the latest ', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    viewReleaseDatesService.getLatestCalculation.mockResolvedValue(stubbedCalculationResults as never)
    return request(app)
      .get('/view/A1234AA/latest')
      .expect(302)
      .expect('Location', '/view/A1234AA/sentences-and-offences/123456')
      .expect(res => {
        expect(res.redirect).toBeTruthy()
      })
  })

  it('GET /view/:nomsId/latest should redirect to the error page if no calculation was found ', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    viewReleaseDatesService.getLatestCalculation.mockRejectedValue({ responseStatus: 404 })
    return request(app)
      .get('/view/A1234AA/latest')
      .expect(404)
      .expect(res => {
        expect(res.text).toContain('have not been submitted using the Calculate release dates')
        expect(res.text).toContain('/calculation/A1234AA/reason')
      })
  })
})

const stubbedPrisonerData = {
  offenderNo: 'A1234AA',
  firstName: 'Anon',
  lastName: 'Nobody',
  latestLocationId: 'LEI',
  locationDescription: 'Inside - Leeds HMP',
  dateOfBirth: '2000-06-24',
  age: 21,
  activeFlag: true,
  legalStatus: 'REMAND',
  category: 'Cat C',
  imprisonmentStatus: 'LIFE',
  imprisonmentStatusDescription: 'Serving Life Imprisonment',
  religion: 'Christian',
  agencyId: 'LEI',
  sentenceDetail: {
    sentenceStartDate: '12/12/2019',
    additionalDaysAwarded: 4,
    tariffDate: '12/12/2030',
    releaseDate: '12/12/2028',
    conditionalReleaseDate: '12/12/2025',
    confirmedReleaseDate: '12/12/2026',
    sentenceExpiryDate: '16/12/2030',
    licenceExpiryDate: '16/12/2030',
  } as PrisonApiSentenceDetail,
  assignedLivingUnit: {
    agencyName: 'Foo Prison (HMP)',
    description: 'D-2-003',
  } as PrisonAPIAssignedLivingUnit,
} as PrisonApiPrisoner

const stubbedCalculationResults = {
  dates: {
    CRD: '2021-02-03',
    SED: '2021-02-03',
    HDCED: '2021-10-03',
  },
  calculationDate: '2020-06-01',
  calculationRequestId: 123456,
  effectiveSentenceLength: null,
  prisonerId: 'A1234AA',
  calculationReference: 'ABC123',
  bookingId: 123,
  calculationStatus: 'CONFIRMED',
  calculationType: 'CALCULATED',
  approvedDates: {},
  calculationReason: {
    id: 1,
    displayName: 'A calculation reason',
    isOther: false,
    useForApprovedDates: false,
    requiresFurtherDetail: false,
  },
} as BookingCalculation
