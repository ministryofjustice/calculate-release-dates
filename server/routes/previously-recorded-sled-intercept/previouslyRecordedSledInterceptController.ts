import { Request, Response } from 'express'
import { Controller } from '../controller'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import PrisonerService from '../../services/prisonerService'
import UserInputService from '../../services/userInputService'
import PreviouslyRecordedSledModel from '../../models/PreviouslyRecordedSledModel'
import { PreviouslyRecordedSledForm } from './previouslyRecordedSledSchema'
import { setSiblingCalculationWithPreviouslyRecordedSLED } from '../../utils/previouslyRecordedSledUtils'

export default class PreviouslyRecordedSledInterceptController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly userInputService: UserInputService,
  ) {}

  GET = async (req: Request<{ nomsId: string; calculationRequestId: string }>, res: Response): Promise<void> => {
    const { caseloads, token, userRoles, username } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)
    const detailedCalculationResults = await this.calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments(
      Number(calculationRequestId),
      token,
    )
    if (!detailedCalculationResults.usedPreviouslyRecordedSLED) {
      return res.redirect(`/calculation/${nomsId}/summary/${calculationRequestId}`)
    }

    return res.render(
      'pages/calculation/previouslyRecordedSledIntercept',
      new PreviouslyRecordedSledModel(
        prisonerDetail,
        detailedCalculationResults.usedPreviouslyRecordedSLED.previouslyRecordedSLEDDate,
        detailedCalculationResults.usedPreviouslyRecordedSLED.calculatedDate,
        `/calculation/${nomsId}/cancelCalculation?redirectUrl=/calculation/${nomsId}/previously-recorded-sled-intercept/${calculationRequestId}`,
        `/calculation/${nomsId}/check-information`,
      ),
    )
  }

  POST = async (
    req: Request<{ nomsId: string; calculationRequestId: string }, unknown, PreviouslyRecordedSledForm>,
    res: Response,
  ): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, calculationRequestId } = req.params
    const { usePreviouslyRecordedSLED } = req.body

    let calculationRequestIdToUse: number
    if (usePreviouslyRecordedSLED === 'YES') {
      calculationRequestIdToUse = Number(calculationRequestId)
    } else {
      const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)
      const userInputsWithHistoricalSLEDAlwaysRequested = { ...userInputs, usePreviouslyRecordedSLEDIfFound: false }
      const calculationRequestModel = this.calculateReleaseDatesService.getCalculationRequestModel(
        req,
        userInputsWithHistoricalSLEDAlwaysRequested,
        nomsId,
      )

      const preliminaryRequest = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(
        nomsId,
        calculationRequestModel,
        username,
      )
      calculationRequestIdToUse = preliminaryRequest.calculationRequestId
      setSiblingCalculationWithPreviouslyRecordedSLED(
        req,
        preliminaryRequest.calculationRequestId,
        Number(calculationRequestId),
      )
    }

    res.redirect(`/calculation/${nomsId}/summary/${calculationRequestIdToUse}`)
  }
}
