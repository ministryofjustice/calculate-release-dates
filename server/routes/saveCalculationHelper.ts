import { Request, Response } from 'express'
import logger from '../../logger'
import { ErrorMessages, ErrorMessageType } from '../types/ErrorMessages'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import { nunjucksEnv } from '../utils/nunjucksSetup'
import { ManualJourneySelectedDate } from '../types/ManualJourney'
import { ManuallyEnteredDate } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

const saveCalculation = async (
  req: Request,
  res: Response,
  calculateReleaseDatesService: CalculateReleaseDatesService,
  errorUrl: string,
) => {
  const { token, username } = res.locals.user
  const { nomsId } = req.params
  const calculationRequestId = Number(req.params.calculationRequestId)
  const breakdownHtml = await getBreakdownFragment(calculationRequestId, username, calculateReleaseDatesService)
  const approvedDates: ManualJourneySelectedDate[] =
    req.session.selectedApprovedDates != null && req.session.selectedApprovedDates[nomsId] != null
      ? req.session.selectedApprovedDates[nomsId]
      : []

  const newApprovedDates: ManuallyEnteredDate[] = approvedDates
    .filter(d => d.manualEntrySelectedDate)
    .map(d => ({
      dateType: d.manualEntrySelectedDate.dateType,
      date: d.manualEntrySelectedDate.date,
    }))
  try {
    const bookingCalculation = await calculateReleaseDatesService.confirmCalculation(
      username,
      nomsId,
      calculationRequestId,
      token,
      {
        calculationFragments: {
          breakdownHtml,
        },
        approvedDates: newApprovedDates,
      },
    )
    res.redirect(`/calculation/${nomsId}/complete/${bookingCalculation.calculationRequestId}`)
  } catch (error) {
    logger.error(error)
    if (error.status === 412) {
      req.flash(
        'serverErrors',
        JSON.stringify({
          messages: [
            {
              text: 'The booking data that was used for this calculation has changed, go back to the Check NOMIS Information screen to see the changes',
              href: `/calculation/${nomsId}/check-information`,
            },
          ],
        } as ErrorMessages),
      )
    } else {
      req.flash(
        'serverErrors',
        JSON.stringify({
          messages: [{ text: 'The calculation could not be saved in NOMIS.' }],
          messageType: ErrorMessageType.SAVE_DATES,
        } as ErrorMessages),
      )
    }
    res.redirect(errorUrl)
  }
}

const getBreakdownFragment = async (
  calculationRequestId: number,
  username: string,
  calculateReleaseDatesService: CalculateReleaseDatesService,
): Promise<string> => {
  const breakdown = await calculateReleaseDatesService.getBreakdown(calculationRequestId, username)
  return nunjucksEnv().render('pages/fragments/breakdownFragment.njk', {
    model: {
      ...breakdown,
      showBreakdown: () => true,
    },
  })
}

export { saveCalculation, getBreakdownFragment }
