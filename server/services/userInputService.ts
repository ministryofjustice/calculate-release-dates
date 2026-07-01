import { Request } from 'express'
import { CalculationUserInputs } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class UserInputService {
  public setCalculationUserInputForPrisoner(req: Request, nomsId: string, userInputs: CalculationUserInputs): void {
    if (!req.session.userInputs) {
      req.session.userInputs = {}
    }
    req.session.userInputs[nomsId] = userInputs
  }

  public resetCalculationUserInputForPrisoner(req: Request, nomsId: string): void {
    if (!req.session.userInputs) {
      req.session.userInputs = {}
    }
    req.session.userInputs[nomsId] = undefined
  }

  public getCalculationUserInputForPrisoner(req: Request, nomsId: string): CalculationUserInputs {
    return (
      (req.session.userInputs && req.session.userInputs[nomsId]) ||
      ({ sentenceCalculationUserInputs: [] } as CalculationUserInputs)
    )
  }

  public isCalculationReasonSet(req: Request, nomsId: string): boolean {
    return req.session.calculationReasonId && !!req.session.calculationReasonId[nomsId]
  }

  public getCalculationReason(req: Request, nomsId: string): number | undefined {
    return req.session.calculationReasonId?.[nomsId]
  }

  private static readonly SECOND_CHECK_REASON_ID = 18

  public isSecondCheck(req: Request, nomsId: string): boolean {
    return req.session.calculationReasonId?.[nomsId] === UserInputService.SECOND_CHECK_REASON_ID
  }

  public getLatestCalculationRequestId(req: Request, nomsId: string): number | undefined {
    return req.session.latestCalculationRequestId?.[nomsId]
  }
}
