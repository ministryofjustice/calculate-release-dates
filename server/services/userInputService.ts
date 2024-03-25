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
}
