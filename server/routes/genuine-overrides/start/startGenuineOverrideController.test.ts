import { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import SessionSetup from '../../testutils/sessionSetup'
import AuthorisedRoles from '../../../enumerations/authorisedRoles'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'

jest.mock('../../../services/calculateReleaseDatesService')

describe('StartGenuineOverrideController', () => {
  let app: Express
  const sessionSetup = new SessionSetup()

  const calculateReleaseDatesService = new CalculateReleaseDatesService(
    null,
  ) as jest.Mocked<CalculateReleaseDatesService>

  const prisonerNumber = 'A1234BC'
  const calculationRequestId = 465987
  const pageUrl = `/calculation/${prisonerNumber}/start-genuine-override/${calculationRequestId}`
  let currentUser: Express.User

  const genuineOverrideInputsHolder = {}

  beforeEach(() => {
    sessionSetup.sessionDoctor = req => {
      req.session.genuineOverrideInputs = genuineOverrideInputsHolder
    }
    currentUser = {
      ...user,
      userRoles: [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR, AuthorisedRoles.ROLE_CRD__GENUINE_OVERRIDES__RW],
    }
    app = appWithAllRoutes({
      services: {
        calculateReleaseDatesService,
      },
      sessionSetup,
      userSupplier: () => currentUser,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should populate with calculated dates excluding hidden date types such as ESED if standard override and redirect to select reason', async () => {
      calculateReleaseDatesService.getGenuineOverrideInputs.mockResolvedValue({
        mode: 'STANDARD',
        calculatedDates: [
          { dateType: 'HDCED', date: '2021-10-03' },
          { dateType: 'CRD', date: '2021-02-04' },
          { dateType: 'ERSED', date: '2020-02-03' },
          { dateType: 'SED', date: '2021-02-03' },
          { dateType: 'ESED', date: '2020-02-05' },
        ],
      })

      await request(app)
        .get(pageUrl)
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/select-reason-for-override/${calculationRequestId}`)

      expect(genuineOverrideInputsHolder[prisonerNumber]).toStrictEqual({
        mode: 'STANDARD',
        datesToSave: [
          { type: 'HDCED', date: '2021-10-03' },
          { type: 'CRD', date: '2021-02-04' },
          { type: 'ERSED', date: '2020-02-03' },
          { type: 'SED', date: '2021-02-03' },
        ],
      })
    })

    it('should split calculated SLED in SED and LED if standard override', async () => {
      calculateReleaseDatesService.getGenuineOverrideInputs.mockResolvedValue({
        mode: 'STANDARD',
        calculatedDates: [{ dateType: 'SLED', date: '2021-10-03' }],
      })

      await request(app)
        .get(pageUrl)
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/select-reason-for-override/${calculationRequestId}`)

      expect(genuineOverrideInputsHolder[prisonerNumber]).toStrictEqual({
        mode: 'STANDARD',
        datesToSave: [
          { type: 'LED', date: '2021-10-03' },
          { type: 'SED', date: '2021-10-03' },
        ],
      })
    })

    it('should populate with previous dates excluding hidden date types such as ESED if express override and redirect to express intercept', async () => {
      calculateReleaseDatesService.getGenuineOverrideInputs.mockResolvedValue({
        mode: 'EXPRESS',
        calculatedDates: [
          { dateType: 'CRD', date: '2035-02-04' },
          { dateType: 'ERSED', date: '2035-02-03' },
        ],
        previousOverrideForExpressGenuineOverride: {
          calculationRequestId: 1234865879,
          dates: [
            { dateType: 'HDCED', date: '2021-10-03' },
            { dateType: 'CRD', date: '2021-02-04' },
            { dateType: 'ERSED', date: '2020-02-03' },
            { dateType: 'SED', date: '2021-02-03' },
            { dateType: 'ESED', date: '2020-02-05' },
          ],
          reason: 'OTHER',
          reasonFurtherDetail: 'Some more deets',
        },
      })

      await request(app)
        .get(pageUrl)
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/express-override-intercept/${calculationRequestId}`)

      expect(genuineOverrideInputsHolder[prisonerNumber]).toStrictEqual({
        mode: 'EXPRESS',
        datesToSave: [
          { type: 'HDCED', date: '2021-10-03' },
          { type: 'CRD', date: '2021-02-04' },
          { type: 'ERSED', date: '2020-02-03' },
          { type: 'SED', date: '2021-02-03' },
        ],
        previousOverride: {
          calculationRequestId: 1234865879,
          reason: 'OTHER',
          reasonFurtherDetail: 'Some more deets',
          dates: [
            { type: 'HDCED', date: '2021-10-03' },
            { type: 'CRD', date: '2021-02-04' },
            { type: 'ERSED', date: '2020-02-03' },
            { type: 'SED', date: '2021-02-03' },
          ],
        },
      })
    })

    it('should split previous calculation SLED into SED and LED if express override', async () => {
      calculateReleaseDatesService.getGenuineOverrideInputs.mockResolvedValue({
        mode: 'EXPRESS',
        calculatedDates: [{ dateType: 'SLED', date: '2021-10-03' }],
        previousOverrideForExpressGenuineOverride: {
          calculationRequestId: 1234865879,
          dates: [{ dateType: 'SLED', date: '2025-11-11' }],
          reason: 'AGGRAVATING_FACTOR_OFFENCE',
        },
      })

      await request(app)
        .get(pageUrl)
        .expect(302)
        .expect('Location', `/calculation/${prisonerNumber}/express-override-intercept/${calculationRequestId}`)

      expect(genuineOverrideInputsHolder[prisonerNumber]).toStrictEqual({
        mode: 'EXPRESS',
        datesToSave: [
          { type: 'LED', date: '2025-11-11' },
          { type: 'SED', date: '2025-11-11' },
        ],
        previousOverride: {
          calculationRequestId: 1234865879,
          reason: 'AGGRAVATING_FACTOR_OFFENCE',
          reasonFurtherDetail: undefined,
          dates: [
            { type: 'LED', date: '2025-11-11' },
            { type: 'SED', date: '2025-11-11' },
          ],
        },
      })
    })
  })
})
