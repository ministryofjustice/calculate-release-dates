import type { Request } from 'express'
import ManualCalculationService from './manualCalculationService'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import AuditService from './auditService'
import ReleaseDateType from '../enumerations/releaseDateType'

type RequestWithSession = Pick<Request, 'session'>
jest.mock('./auditService')

const token = 'token-123'
const username = 'j.smith'
const prisonerId = 'A1234BC'

interface ManualEntryDate {
  dateType: string
  date: string
}
interface SessionLike {
  calculationReasonId: Record<string, number>
  otherReasonDescription: Record<string, string>
  selectedManualEntryDates: Record<string, ManualEntryDate[]>
  manualEntryRoutingForBookings: string[]
}
interface ReqLike {
  session: SessionLike
}

const makeReq = (overrides: Partial<ReqLike> = {}): ReqLike => ({
  session: {
    calculationReasonId: { [prisonerId]: 123 },
    otherReasonDescription: { [prisonerId]: 'Operational need' },
    selectedManualEntryDates: {
      [prisonerId]: [{ dateType: 'CRD', date: '2026-01-01' }],
    },
    manualEntryRoutingForBookings: [prisonerId],
  },
  ...overrides,
})

describe('ManualCalculationService.storeManualCalculation', () => {
  let service: ManualCalculationService
  let auditMock: jest.Mocked<AuditService>

  beforeEach(() => {
    jest.resetAllMocks()
    auditMock = new (AuditService as jest.MockedClass<typeof AuditService>)() as jest.Mocked<AuditService>
    auditMock.publishManualSentenceCalculation.mockResolvedValue()
    auditMock.publishManualSentenceCalculationFailure.mockResolvedValue()
    service = new ManualCalculationService(auditMock)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('success: returns ManualCalculationResponse and audits success', async () => {
    const entered = new Map<ReleaseDateType, string>([[ReleaseDateType.CRD, '2026-01-01']])

    jest
      .spyOn(CalculateReleaseDatesApiClient.prototype, 'storeManualCalculation')
      .mockResolvedValue({ enteredDates: entered, calculationRequestId: 456 })

    const req = makeReq() as unknown as RequestWithSession
    const resp = await service.storeManualCalculation(username, prisonerId, req, token)

    expect(resp).toEqual({
      enteredDates: entered,
      calculationRequestId: 456,
    })
    expect(auditMock.publishManualSentenceCalculation).toHaveBeenCalledWith(username, prisonerId, entered, 123)
    expect(auditMock.publishManualSentenceCalculationFailure).not.toHaveBeenCalled()
  })
  ;[{ name: 'lockedRecord', message: 'NOMIS record is locked', status: 423 }].forEach(({ name, message, status }) => {
    it(`locked (${name}): audits failure and rethrows 423`, async () => {
      const req = makeReq() as unknown as RequestWithSession

      jest
        .spyOn(CalculateReleaseDatesApiClient.prototype, 'storeManualCalculation')
        .mockRejectedValue({ status, message })

      await expect(service.storeManualCalculation(username, prisonerId, req, token)).rejects.toMatchObject({
        status: 423,
      })

      expect(auditMock.publishManualSentenceCalculationFailure).toHaveBeenCalled()
      expect(auditMock.publishManualSentenceCalculation).not.toHaveBeenCalled()
      expect(req.session.manualEntryRoutingForBookings).toContain(prisonerId)
    })
  })

  it('412 precondition failed: audits failure and rethrows', async () => {
    const req = makeReq() as unknown as RequestWithSession

    jest
      .spyOn(CalculateReleaseDatesApiClient.prototype, 'storeManualCalculation')
      .mockRejectedValue({ status: 412, message: 'Stale data' })

    await expect(service.storeManualCalculation(username, prisonerId, req, token)).rejects.toMatchObject({
      status: 412,
    })

    expect(auditMock.publishManualSentenceCalculationFailure).toHaveBeenCalled()
    expect(auditMock.publishManualSentenceCalculation).not.toHaveBeenCalled()
  })

  it('other failures (e.g. 502): audits failure and rethrows', async () => {
    const req = makeReq() as unknown as RequestWithSession

    jest
      .spyOn(CalculateReleaseDatesApiClient.prototype, 'storeManualCalculation')
      .mockRejectedValue({ status: 502, message: 'Bad gateway to NOMIS' })

    await expect(service.storeManualCalculation(username, prisonerId, req, token)).rejects.toMatchObject({
      status: 502,
    })

    expect(auditMock.publishManualSentenceCalculationFailure).toHaveBeenCalled()
  })
})
