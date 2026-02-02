import { Request, Response } from 'express'
import { Controller } from '../../controller'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import PrisonerService from '../../../services/prisonerService'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import {
  ManualEntrySelectedDateType,
  SubmitCalculationRequest,
} from '../../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { redirectToInputWithErrors } from '../../../middleware/validationMiddleware'
import { PersonJourneyParams } from '../../../@types/journeys'
import ApprovedDatesUrls from '../approvedDateUrls'
import { dateToDayMonthYear, sortDisplayableDates } from '../../../utils/utils'
import ReviewApprovedDatesViewModel from '../../../models/approved-dates/ReviewApprovedDatesViewModel'
import { getBreakdownFragment } from '../../saveCalculationHelper'
import { approvedDateTypes } from '../approvedDatesUtils'

export default class ReviewApprovedDatesController implements Controller {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly dateTypeConfigurationService: DateTypeConfigurationService,
  ) {}

  GET = async (req: Request<PersonJourneyParams>, res: Response): Promise<void> => {
    const { nomsId, journeyId } = req.params
    const { caseloads, userRoles, username } = res.locals.user

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)
    const journey = req.session.approvedDatesJourneys[journeyId]
    sortDisplayableDates(journey.datesToSave)
    const dateTypeDefinitions = await this.dateTypeConfigurationService.dateTypeToDescriptionMapping(
      username,
      'DESCRIPTION_ONLY',
    )
    let addLink: string
    if (journey.datesToSave.length < approvedDateTypes.length) {
      addLink = ApprovedDatesUrls.selectDatesToAdd(prisonerDetail.offenderNo, journeyId)
    }
    let backLink: string
    if (journey.datesToSave.length === 0) {
      backLink = ApprovedDatesUrls.selectDatesToAdd(nomsId, journeyId)
    } else {
      backLink = ApprovedDatesUrls.reviewCalculatedDates(nomsId, journeyId)
    }
    return res.render(
      'pages/approvedDates/standalone/reviewApprovedDates',
      new ReviewApprovedDatesViewModel(
        prisonerDetail,
        journeyId,
        journey.datesToSave,
        dateTypeDefinitions,
        addLink,
        backLink,
        ApprovedDatesUrls.reviewApprovedDates(nomsId, journeyId),
      ),
    )
  }

  POST = async (req: Request<PersonJourneyParams>, res: Response): Promise<void> => {
    const { nomsId, journeyId } = req.params
    const { token, username } = res.locals.user
    const journey = req.session.approvedDatesJourneys[journeyId]

    const result = await getBreakdownFragment(
      journey.preliminaryCalculationRequestId,
      username,
      this.calculateReleaseDatesService,
    )
      .then(breakdownHtml => {
        const confirmCalcRequest: SubmitCalculationRequest = {
          calculationFragments: {
            breakdownHtml,
          },
          approvedDates: journey.datesToSave.map(date => ({
            dateType: date.type as ManualEntrySelectedDateType,
            date: dateToDayMonthYear(date.date),
          })),
        }
        return this.calculateReleaseDatesService.confirmCalculation(
          username,
          nomsId,
          journey.preliminaryCalculationRequestId,
          token,
          confirmCalcRequest,
        )
      })
      .then(
        bookingCalculation => {
          return { success: true, bookingCalculation, errorCode: null }
        },
        error => {
          return {
            success: false,
            bookingCalculation: null,
            errorCode: error.status,
          }
        },
      )

    if (!result.success) {
      return redirectToInputWithErrors(req, res, { datesToSave: ['Adding approved dates failed'] })
    }
    return res.redirect(`/calculation/${nomsId}/complete/${result.bookingCalculation.calculationRequestId}`)
  }
}
