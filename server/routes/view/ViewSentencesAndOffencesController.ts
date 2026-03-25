import { Request, Response } from 'express'
import { Controller } from '../controller'
import PrisonerService from '../../services/prisonerService'
import ViewReleaseDatesService from '../../services/viewReleaseDatesService'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import SentenceTypes from '../../models/SentenceTypes'
import ViewRouteSentenceAndOffenceViewModel from '../../models/ViewRouteSentenceAndOffenceViewModel'
import SentenceAndOffencePageViewModel from '../../models/SentenceAndOffencePageViewModel'
import { PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'
import { longDateFormat } from '../../utils/utils'
import config from '../../config'

export default class ViewSentencesAndOffencesController implements Controller {
  constructor(
    private readonly viewReleaseDatesService: ViewReleaseDatesService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { caseloads, userRoles, username } = res.locals.user
    const { nomsId } = req.params
    const calculationRequestId = Number(req.params.calculationRequestId)

    await this.prisonerService.checkPrisonerAccess(nomsId, username, caseloads, userRoles)

    try {
      const prisonerDetail = await this.viewReleaseDatesService.getPrisonerDetail(calculationRequestId, username)
      const sentencesAndOffences = await this.viewReleaseDatesService.getSentencesAndOffences(
        calculationRequestId,
        username,
      )
      const adjustmentDetails = await this.viewReleaseDatesService.getBookingAndSentenceAdjustments(
        calculationRequestId,
        username,
      )
      const adjustmentDtos = config.featureToggles.adjustmentsIntegrationEnabled
        ? await this.viewReleaseDatesService.getAdjustmentsDtosForCalculation(calculationRequestId, username)
        : []
      const calculationUserInputs = await this.viewReleaseDatesService.getCalculationUserInputs(
        calculationRequestId,
        username,
      )
      const detailedCalculationResults = await this.calculateReleaseDatesService.getResultsWithBreakdownAndAdjustments(
        calculationRequestId,
        username,
      )
      const returnToCustody = (sentencesAndOffences as PrisonApiOffenderSentenceAndOffences[]).filter(s =>
        SentenceTypes.isSentenceFixedTermRecall(s),
      ).length
        ? await this.viewReleaseDatesService.getReturnToCustodyDate(calculationRequestId, username)
        : null

      res.render(
        'pages/view/sentencesAndOffences',
        new SentenceAndOffencePageViewModel(
          new ViewRouteSentenceAndOffenceViewModel(
            prisonerDetail,
            calculationUserInputs,
            sentencesAndOffences,
            adjustmentDetails,
            detailedCalculationResults.context.calculationType,
            returnToCustody,
            null,
            detailedCalculationResults.context.calculationReason,
            detailedCalculationResults.context.otherReasonDescription,
            detailedCalculationResults.context.calculationDate === undefined
              ? undefined
              : longDateFormat(detailedCalculationResults.context.calculationDate),
            adjustmentDtos,
            detailedCalculationResults.context.genuineOverrideReasonDescription,
            detailedCalculationResults.context.calculatedByDisplayName,
            detailedCalculationResults.context.calculatedAtPrisonDescription,
          ),
          calculationRequestId,
          nomsId,
        ),
      )
    } catch (error) {
      if ((error.status ?? error.responseStatus) === 404 && error.data?.errorCode === 'PRISON_API_DATA_MISSING') {
        res.redirect(`/view/${nomsId}/calculation-summary/${calculationRequestId}`)
      } else {
        throw error
      }
    }
  }
}
