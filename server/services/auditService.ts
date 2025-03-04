import { auditService } from '@ministryofjustice/hmpps-audit-client'
import logger from '../../logger'

export default class AuditService {
  private serviceName = 'calculate-release-dates'

  public async publishSentenceCalculation(
    user: string,
    prisonerId: string,
    nomisId: string,
    calculationReference: string,
  ) {
    try {
      await auditService.sendAuditMessage({
        action: 'CALCULATION_CREATED',
        who: user,
        subjectId: prisonerId,
        subjectType: 'CALCULATION',
        service: this.serviceName,
        details: `{ "nomisId": "${nomisId}", "calculationReference": "${calculationReference}" }`,
      })
    } catch (error) {
      logger.error(`Failed to publish audit event CALCULATION_CREATED: ${error.message}`)
    }
  }

  public async publishSentenceCalculationFailure(user: string, nomisId: string, exception: Error) {
    try {
      await auditService.sendAuditMessage({
        action: 'CALCULATION_FAILED',
        who: user,
        subjectId: nomisId,
        subjectType: 'CALCULATION',
        service: this.serviceName,
        details: exception.message,
      })
    } catch (error) {
      logger.error(`Failed to publish audit event CALCULATION_FAILED: ${error.message}`)
    }
  }
}
