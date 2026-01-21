import { Request, Response } from 'express'
import { Controller } from '../controller'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import PrisonerService from '../../services/prisonerService'
import UserInputService from '../../services/userInputService'
import ConcurrentConsecutiveSentence from '../../models/ConcurrentConsecutiveSentencesModel'

export default class MultipleConsecutiveToInterceptController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly userInputService: UserInputService,
  ) {}

  GET = async (req: Request<{ nomsId: string }>, res: Response): Promise<void> => {
    const { caseloads, userRoles } = res.locals.user
    const { nomsId } = req.params
    const { duration } = req.query as Record<string, string>
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, userRoles)

    if (req.session.calculationReasonId == null || duration == null) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }

    return res.render(
      'pages/calculation/consecutiveConcurrentSentences',
      new ConcurrentConsecutiveSentence(
        prisonerDetail,
        duration,
        `/calculation/${nomsId}/cancelCalculation?redirectUrl=/calculation/${nomsId}/check-information`,
        `/calculation/${nomsId}/check-information/`,
      ),
    )
  }

  POST = async (req: Request<{ nomsId: string }>, res: Response): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId } = req.params
    const { sentenceDuration } = req.body

    const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, nomsId)
    const userInputsWithHistoricalSLEDAlwaysRequested = { ...userInputs, usePreviouslyRecordedSLEDIfFound: true }
    const calculationRequestModel = this.calculateReleaseDatesService.getCalculationRequestModel(
      req,
      userInputsWithHistoricalSLEDAlwaysRequested,
      nomsId,
    )

    const preliminaryRequest = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(
      nomsId,
      calculationRequestModel,
      token,
    )
    if (preliminaryRequest.usedPreviouslyRecordedSLED) {
      res.redirect(
        `/calculation/${nomsId}/previously-recorded-sled-intercept/${preliminaryRequest.calculationRequestId}`,
      )
    } else {
      res.redirect(
        `summary/${preliminaryRequest.calculationRequestId}?callbackUrl=/calculation/${nomsId}/concurrent-consecutive?duration=${sentenceDuration}`,
      )
    }
  }
}
