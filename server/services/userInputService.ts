import { Request } from 'express'
import {
  BookingCalculation,
  CalculationUserInputs,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

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

  public setCalculationReasonFromBooking(req: Request, calculation: BookingCalculation) {
    if (!req.session.calculationReasonId) {
      req.session.calculationReasonId = {}
    }
    if (!req.session.otherReasonDescription) {
      req.session.otherReasonDescription = {}
    }
    req.session.calculationReasonId[calculation.prisonerId] = calculation.calculationReason?.id
    req.session.otherReasonDescription[calculation.prisonerId] = calculation.otherReasonDescription
  }

  public isCalculationReasonSet(req: Request, nomsId: string): boolean {
    return req.session.calculationReasonId && req.session.calculationReasonId[nomsId]
  }
}
