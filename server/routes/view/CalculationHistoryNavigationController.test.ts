import request from 'supertest'
import type { Express } from 'express'
import PrisonerService from '../../services/prisonerService'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import { appWithAllRoutes } from '../testutils/appSetup'
import { HistoricCalculationSummaryPage } from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonAPIAssignedLivingUnit, PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'

jest.mock('../../services/prisonerService')
jest.mock('../../services/viewReleaseDatesService')
jest.mock('../../services/calculateReleaseDatesService')

const prisonerService = new PrisonerService(null, null) as jest.Mocked<PrisonerService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(
  null,
  null,
) as jest.Mocked<CalculateReleaseDatesService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      prisonerService,
      calculateReleaseDatesService,
    },
  })
})

describe('View calculation history overview', () => {
  it('Should navigate to newer calculations and select the last one in the page if it is a CRDS calc', () => {
    calculateReleaseDatesService.getCalculationHistoryPage.mockResolvedValue(stubbedFullPageOfCalculationHistory)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/view/A1234AA/calculation-history/newer?currentPage=3')
      .expect(302)
      .expect('Location', '/view/A1234AA/calculation-history/CRDS/21/overview?page=2')
      .expect(_ => {
        expect(calculateReleaseDatesService.getCalculationHistoryPage).toHaveBeenCalledWith('A1234AA', 2, 10, 'user1')
      })
  })
  it('Should navigate to older calculations and select the first one in the page if it is a CRDS calc', () => {
    calculateReleaseDatesService.getCalculationHistoryPage.mockResolvedValue(stubbedFullPageOfCalculationHistory)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/view/A1234AA/calculation-history/older?currentPage=3')
      .expect(302)
      .expect('Location', '/view/A1234AA/calculation-history/CRDS/30/overview?page=4')
      .expect(_ => {
        expect(calculateReleaseDatesService.getCalculationHistoryPage).toHaveBeenCalledWith('A1234AA', 4, 10, 'user1')
      })
  })
  it('Should navigate to newer calculations and select the last one in the page if it is a NOMIS calc', () => {
    calculateReleaseDatesService.getCalculationHistoryPage.mockResolvedValue({
      ...stubbedFullPageOfCalculationHistory,
      items: stubbedFullPageOfCalculationHistory.items.map(item => {
        return { ...item, calculationSource: 'NOMIS', nomisCalculationId: item.crdsCalculationId + 100 }
      }),
    })
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/view/A1234AA/calculation-history/newer?currentPage=3')
      .expect(302)
      .expect('Location', '/view/A1234AA/calculation-history/NOMIS/121/overview?page=2')
      .expect(_ => {
        expect(calculateReleaseDatesService.getCalculationHistoryPage).toHaveBeenCalledWith('A1234AA', 2, 10, 'user1')
      })
  })
  it('Should navigate to older calculations and select the first one in the page if it is a NOMIS calc', () => {
    calculateReleaseDatesService.getCalculationHistoryPage.mockResolvedValue({
      ...stubbedFullPageOfCalculationHistory,
      items: stubbedFullPageOfCalculationHistory.items.map(item => {
        return { ...item, calculationSource: 'NOMIS', nomisCalculationId: item.crdsCalculationId + 100 }
      }),
    })
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get('/view/A1234AA/calculation-history/older?currentPage=3')
      .expect(302)
      .expect('Location', '/view/A1234AA/calculation-history/NOMIS/130/overview?page=4')
      .expect(_ => {
        expect(calculateReleaseDatesService.getCalculationHistoryPage).toHaveBeenCalledWith('A1234AA', 4, 10, 'user1')
      })
  })
})

const stubbedPrisonerData: PrisonApiPrisoner = {
  bookingId: 1,
  offenderId: 1,
  rootOffenderId: 1,
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
  assignedLivingUnit: {
    agencyName: 'Foo Prison (HMP)',
    description: 'D-2-003',
  } as PrisonAPIAssignedLivingUnit,
}

const stubbedFullPageOfCalculationHistory: HistoricCalculationSummaryPage = {
  items: [
    {
      calculationDate: '2025-06-30',
      calculationSource: 'CRDS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 30,
      reasonDescription: 'First one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
    {
      calculationDate: '2025-06-29',
      calculationSource: 'NOMIS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 29,
      nomisCalculationId: 9999929,
      reasonDescription: 'Second one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
    {
      calculationDate: '2025-06-28',
      calculationSource: 'CRDS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 28,
      reasonDescription: 'Third one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
    {
      calculationDate: '2025-06-27',
      calculationSource: 'CRDS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 27,
      reasonDescription: 'Fourth one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
    {
      calculationDate: '2025-06-26',
      calculationSource: 'CRDS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 26,
      reasonDescription: 'Fifth one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
    {
      calculationDate: '2025-06-25',
      calculationSource: 'CRDS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 25,
      reasonDescription: 'Sixth one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
    {
      calculationDate: '2025-06-24',
      calculationSource: 'CRDS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 24,
      reasonDescription: 'Seventh one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
    {
      calculationDate: '2025-06-23',
      calculationSource: 'CRDS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 23,
      reasonDescription: 'Eighth one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
    {
      calculationDate: '2025-06-22',
      calculationSource: 'CRDS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 22,
      reasonDescription: 'Ninth one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
    {
      calculationDate: '2025-06-21',
      calculationSource: 'CRDS',
      calculationType: 'CALCULATED',
      crdsCalculationId: 21,
      nomisCalculationId: 212121,
      reasonDescription: 'Tenth one',
      calculatedByDisplayName: 'Fred',
      establishmentCalculatedAtDescription: 'Kirkham',
    },
  ],
  page: {
    pageNumber: 1,
    totalPages: 5,
    totalItems: 57,
  },
}
