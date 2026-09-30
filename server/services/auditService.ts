import { AuditService as HmppsAuditService, AuditServiceFactory } from '@ministryofjustice/hmpps-audit-client'
import logger from '../../logger'
import ReleaseDateType from '../enumerations/releaseDateType'
import AuditAction from '../enumerations/auditType'

type SubjectType = 'CALCULATION'

export default class AuditService {
  private readonly hmppsAuditService: HmppsAuditService<string, SubjectType> =
    AuditServiceFactory.configureFromEnv(logger)

  private async sendAuditMessage(
    action: AuditAction,
    user: string,
    subjectId: string,
    details: Record<string, unknown>,
  ) {
    try {
      await this.hmppsAuditService.logAuditEvent({
        what: action,
        who: user,
        subjectId,
        subjectType: 'CALCULATION',
        details,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error(`Failed to publish audit event ${action}: ${message}`)
    }
  }

  public async publishSentenceCalculation(
    user: string,
    prisonerId: string,
    nomisId: string,
    calculationReference: string,
  ) {
    await this.sendAuditMessage(AuditAction.CALCULATION_CREATED, user, prisonerId, { nomisId, calculationReference })
  }

  public async publishSecondCheckAudit(
    action: AuditAction,
    user: string,
    prisonerId: string,
    calculationReference: number,
    exception: Error | null,
  ) {
    const details =
      action === AuditAction.SECOND_CHECK_FAILED && exception
        ? { error: exception.message }
        : { prisonerId, calculationReference }
    await this.sendAuditMessage(action, user, prisonerId, details)
  }

  public async publishManualSentenceCalculation(
    user: string,
    prisonerId: string,
    dates: Map<ReleaseDateType, string>,
    reasonId: number,
  ) {
    // `dates` is a plain object at runtime (deserialised from the API's JSON response),
    // despite being typed as a Map, so it must be spread rather than passed to Object.fromEntries.
    await this.sendAuditMessage(AuditAction.MANUAL_CALCULATION_CREATED, user, prisonerId, {
      ...dates,
      reasonId,
    })
  }

  public async publishManualSentenceCalculationFailure(user: string, nomisId: string, exception: Error) {
    await this.sendAuditMessage(AuditAction.MANUAL_CALCULATION_FAILED, user, nomisId, { error: exception.message })
  }

  public async publishSentenceCalculationFailure(user: string, nomisId: string, exception: Error) {
    await this.sendAuditMessage(AuditAction.CALCULATION_FAILED, user, nomisId, { error: exception.message })
  }

  public async publishBulkComparison(
    user: string,
    selectedOMU: string,
    comparisonShortReference: string,
    comparisonType: string,
  ) {
    await this.sendAuditMessage(AuditAction.BULK_COMPARISON_CREATED, user, selectedOMU, {
      comparisonShortReference,
      comparisonType,
    })
  }

  public async publishBulkComparisonFailure(user: string, selectedOMU: string, exception: Error) {
    await this.sendAuditMessage(AuditAction.BULK_COMPARISON_FAILED, user, selectedOMU, {
      error: exception.message,
    })
  }

  public async publishGenuineOverride(
    user: string,
    prisonerNumber: string,
    originalCalculationRequestId: number,
    overrideCalculationRequestId: number,
  ) {
    await this.sendAuditMessage(AuditAction.GENUINE_OVERRIDE_CREATED, user, prisonerNumber, {
      prisonerNumber,
      originalCalculationRequestId,
      overrideCalculationRequestId,
    })
  }

  public async publishGenuineOverrideFailed(
    user: string,
    prisonerNumber: string,
    originalCalculationRequestId: number,
    exception: Error,
  ) {
    await this.sendAuditMessage(AuditAction.GENUINE_OVERRIDE_FAILED, user, prisonerNumber, {
      originalCalculationRequestId,
      error: exception.message,
    })
  }
}
