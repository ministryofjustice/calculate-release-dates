import { auditService } from '@ministryofjustice/hmpps-audit-client'
import logger from '../../logger'
import ReleaseDateType from '../enumerations/releaseDateType'
import AuditAction from '../enumerations/auditType'

export default class AuditService {
  private serviceName = 'calculate-release-dates'

  private async sendAuditMessage(action: AuditAction, user: string, subjectId: string, details: string) {
    try {
      await auditService.sendAuditMessage({
        action,
        who: user,
        subjectId,
        subjectType: 'CALCULATION',
        service: this.serviceName,
        details,
      })
    } catch (error) {
      logger.error(`Failed to publish audit event ${action}: ${error.message}`)
    }
  }

  public async publishSentenceCalculation(
    user: string,
    prisonerId: string,
    nomisId: string,
    calculationReference: string,
  ) {
    const details = `{ "nomisId": "${nomisId}", "calculationReference": "${calculationReference}" }`
    await this.sendAuditMessage(AuditAction.CALCULATION_CREATED, user, prisonerId, details)
  }

  public async publishManualSentenceCalculation(
    user: string,
    prisonerId: string,
    dates: Map<ReleaseDateType, string>,
    reasonId: string,
  ) {
    const detail = { ...dates, reasonId }
    await this.sendAuditMessage(AuditAction.MANUAL_CALCULATION_CREATED, user, prisonerId, JSON.stringify(detail))
  }

  public async publishManualSentenceCalculationFailure(user: string, nomisId: string, exception: Error) {
    await this.sendAuditMessage(AuditAction.MANUAL_CALCULATION_FAILED, user, nomisId, exception.message)
  }

  public async publishSentenceCalculationFailure(user: string, nomisId: string, exception: Error) {
    await this.sendAuditMessage(AuditAction.CALCULATION_FAILED, user, nomisId, exception.message)
  }
}
