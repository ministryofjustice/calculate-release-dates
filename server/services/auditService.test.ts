import { AuditServiceFactory } from '@ministryofjustice/hmpps-audit-client'
import AuditService from './auditService'
import AuditAction from '../enumerations/auditType'
import ReleaseDateType from '../enumerations/releaseDateType'
import logger from '../../logger'

jest.mock('@ministryofjustice/hmpps-audit-client')
jest.mock('../../logger')

describe('AuditService', () => {
  const logAuditEvent = jest.fn()
  let auditService: AuditService

  beforeEach(() => {
    jest.clearAllMocks()
    ;(AuditServiceFactory.configureFromEnv as jest.Mock).mockReturnValue({ logAuditEvent })
    auditService = new AuditService()
  })

  it('publishes a sentence calculation event with the expected audit details', async () => {
    await auditService.publishSentenceCalculation('a-user', 'A1234BC', 'A1234BC', 'CAL-REF-1')

    expect(logAuditEvent).toHaveBeenCalledWith({
      what: AuditAction.CALCULATION_CREATED,
      who: 'a-user',
      subjectId: 'A1234BC',
      subjectType: 'CALCULATION',
      details: { nomisId: 'A1234BC', calculationReference: 'CAL-REF-1' },
    })
  })

  it('publishes a sentence calculation failure event', async () => {
    const exception = new Error('boom')

    await auditService.publishSentenceCalculationFailure('a-user', 'A1234BC', exception)

    expect(logAuditEvent).toHaveBeenCalledWith({
      what: AuditAction.CALCULATION_FAILED,
      who: 'a-user',
      subjectId: 'A1234BC',
      subjectType: 'CALCULATION',
      details: { error: 'boom' },
    })
  })

  it('publishes a second check audit event with prisoner details when not a failure', async () => {
    await auditService.publishSecondCheckAudit(AuditAction.SECOND_CHECK_RECORDED, 'a-user', 'A1234BC', 123, null)

    expect(logAuditEvent).toHaveBeenCalledWith({
      what: AuditAction.SECOND_CHECK_RECORDED,
      who: 'a-user',
      subjectId: 'A1234BC',
      subjectType: 'CALCULATION',
      details: { prisonerId: 'A1234BC', calculationReference: 123 },
    })
  })

  it('publishes a second check audit failure event with the exception message', async () => {
    const exception = new Error('second check failed')

    await auditService.publishSecondCheckAudit(AuditAction.SECOND_CHECK_FAILED, 'a-user', 'A1234BC', 123, exception)

    expect(logAuditEvent).toHaveBeenCalledWith({
      what: AuditAction.SECOND_CHECK_FAILED,
      who: 'a-user',
      subjectId: 'A1234BC',
      subjectType: 'CALCULATION',
      details: { error: 'second check failed' },
    })
  })

  it('publishes a manual sentence calculation event including the entered dates', async () => {
    // The API returns `enteredDates` as a plain JSON object, not a real Map instance,
    // despite the `Map<ReleaseDateType, string>` type on `publishManualSentenceCalculation`.
    const dates = { [ReleaseDateType.CRD]: '2024-01-01' } as unknown as Map<ReleaseDateType, string>

    await auditService.publishManualSentenceCalculation('a-user', 'A1234BC', dates, 7)

    expect(logAuditEvent).toHaveBeenCalledWith({
      what: AuditAction.MANUAL_CALCULATION_CREATED,
      who: 'a-user',
      subjectId: 'A1234BC',
      subjectType: 'CALCULATION',
      details: { [ReleaseDateType.CRD]: '2024-01-01', reasonId: 7 },
    })
  })

  it('publishes a manual sentence calculation failure event', async () => {
    const exception = new Error('manual failure')

    await auditService.publishManualSentenceCalculationFailure('a-user', 'A1234BC', exception)

    expect(logAuditEvent).toHaveBeenCalledWith({
      what: AuditAction.MANUAL_CALCULATION_FAILED,
      who: 'a-user',
      subjectId: 'A1234BC',
      subjectType: 'CALCULATION',
      details: { error: 'manual failure' },
    })
  })

  it('publishes a bulk comparison event', async () => {
    await auditService.publishBulkComparison('a-user', 'OMU1', 'SHORT-REF', 'MANUAL')

    expect(logAuditEvent).toHaveBeenCalledWith({
      what: AuditAction.BULK_COMPARISON_CREATED,
      who: 'a-user',
      subjectId: 'OMU1',
      subjectType: 'CALCULATION',
      details: { comparisonShortReference: 'SHORT-REF', comparisonType: 'MANUAL' },
    })
  })

  it('publishes a bulk comparison failure event', async () => {
    const exception = new Error('comparison failure')

    await auditService.publishBulkComparisonFailure('a-user', 'OMU1', exception)

    expect(logAuditEvent).toHaveBeenCalledWith({
      what: AuditAction.BULK_COMPARISON_FAILED,
      who: 'a-user',
      subjectId: 'OMU1',
      subjectType: 'CALCULATION',
      details: { error: 'comparison failure' },
    })
  })

  it('publishes a genuine override event', async () => {
    await auditService.publishGenuineOverride('a-user', 'A1234BC', 111, 222)

    expect(logAuditEvent).toHaveBeenCalledWith({
      what: AuditAction.GENUINE_OVERRIDE_CREATED,
      who: 'a-user',
      subjectId: 'A1234BC',
      subjectType: 'CALCULATION',
      details: { prisonerNumber: 'A1234BC', originalCalculationRequestId: 111, overrideCalculationRequestId: 222 },
    })
  })

  it('publishes a genuine override failure event', async () => {
    const exception = new Error('override failure')

    await auditService.publishGenuineOverrideFailed('a-user', 'A1234BC', 111, exception)

    expect(logAuditEvent).toHaveBeenCalledWith({
      what: AuditAction.GENUINE_OVERRIDE_FAILED,
      who: 'a-user',
      subjectId: 'A1234BC',
      subjectType: 'CALCULATION',
      details: { originalCalculationRequestId: 111, error: 'override failure' },
    })
  })

  it('logs an error and does not throw when the audit client fails to send the message', async () => {
    logAuditEvent.mockRejectedValueOnce(new Error('sqs unavailable'))

    await expect(
      auditService.publishSentenceCalculationFailure('a-user', 'A1234BC', new Error('boom')),
    ).resolves.not.toThrow()

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(`Failed to publish audit event ${AuditAction.CALCULATION_FAILED}`),
    )
  })

  it('is fail-safe and does not throw when the audit queue is unreachable', async () => {
    const connectionError = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:4566'), {
      code: 'ECONNREFUSED',
    })
    logAuditEvent.mockRejectedValueOnce(connectionError)

    await expect(
      auditService.publishSentenceCalculation('a-user', 'A1234BC', 'A1234BC', 'CAL-REF-1'),
    ).resolves.toBeUndefined()

    expect(logAuditEvent).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        `Failed to publish audit event ${AuditAction.CALCULATION_CREATED}: connect ECONNREFUSED 127.0.0.1:4566`,
      ),
    )
  })

  it('is fail-safe and does not throw when the audit client rejects with a non-Error value', async () => {
    logAuditEvent.mockRejectedValueOnce('queue unreachable')

    await expect(auditService.publishGenuineOverride('a-user', 'A1234BC', 111, 222)).resolves.toBeUndefined()

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        `Failed to publish audit event ${AuditAction.GENUINE_OVERRIDE_CREATED}: queue unreachable`,
      ),
    )
  })
})
