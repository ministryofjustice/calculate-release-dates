import { Request } from 'express'

const setSiblingCalculationWithPreviouslyRecordedSLED = (
  request: Request,
  calculationRequestWithoutSLED: number,
  calculationRequestWithSLED: number,
) => {
  const { session } = request
  if (!session.siblingCalculationWithPreviouslyRecordedSLED) {
    session.siblingCalculationWithPreviouslyRecordedSLED = {}
  }
  session.siblingCalculationWithPreviouslyRecordedSLED[calculationRequestWithoutSLED] = calculationRequestWithSLED
}

const getSiblingCalculationWithPreviouslyRecordedSLED = (
  request: Request,
  calculationRequestWithoutSLED: number,
): number | undefined => {
  const { session } = request
  if (!session.siblingCalculationWithPreviouslyRecordedSLED) {
    session.siblingCalculationWithPreviouslyRecordedSLED = {}
  }
  return session.siblingCalculationWithPreviouslyRecordedSLED[calculationRequestWithoutSLED]
}

export { setSiblingCalculationWithPreviouslyRecordedSLED, getSiblingCalculationWithPreviouslyRecordedSLED }
