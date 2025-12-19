import { Request, Response } from 'express'
import { Controller } from '../../controller'
import GenuineOverrideUrls from '../genuineOverrideUrls'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import { GenuineOverrideDate } from '../../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { filteredListOfDates } from '../../../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'
import { EnteredDate, GenuineOverrideInputs } from '../../../@types/journeys'

export default class StartGenuineOverrideController implements Controller {
  constructor(private readonly calculateReleaseDatesService: CalculateReleaseDatesService) {}

  GET = async (
    req: Request<{
      nomsId: string
      calculationRequestId: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { nomsId, calculationRequestId } = req.params
    const { token } = res.locals.user

    if (!req.session.genuineOverrideInputs) {
      req.session.genuineOverrideInputs = {}
    }

    const result = await this.calculateReleaseDatesService.getGenuineOverrideInputs(Number(calculationRequestId), token)
    let url: string
    let inputs: GenuineOverrideInputs
    if (result.mode === 'STANDARD' || !result.previousOverrideForExpressGenuineOverride) {
      url = GenuineOverrideUrls.selectReasonForOverride(nomsId, calculationRequestId)
      inputs = {
        mode: 'STANDARD',
        datesToSave: this.mapDates(result.calculatedDates),
      }
    } else {
      url = GenuineOverrideUrls.interceptForExpressOverride(nomsId, calculationRequestId)
      inputs = {
        mode: 'EXPRESS',
        datesToSave: this.mapDates(result.previousOverrideForExpressGenuineOverride!.dates ?? []),
        previousOverride: {
          calculationRequestId: result.previousOverrideForExpressGenuineOverride.calculationRequestId,
          reason: result.previousOverrideForExpressGenuineOverride.reason,
          reasonFurtherDetail: result.previousOverrideForExpressGenuineOverride.reasonFurtherDetail,
          dates: this.mapDates(result.previousOverrideForExpressGenuineOverride.dates),
        },
      }
    }
    req.session.genuineOverrideInputs[nomsId] = inputs
    return res.redirect(url)
  }

  private mapDates(dates: GenuineOverrideDate[]): EnteredDate[] {
    return (
      dates
        // exclude ESED and any other hidden date types.
        .filter(it => filteredListOfDates.indexOf(it.dateType) >= 0)
        .flatMap(date => {
          // decompose SLED into SED and LED to allow users to override them to be different dates
          if (date.dateType === 'SLED') {
            return [
              {
                type: 'LED',
                date: date.date,
              },
              {
                type: 'SED',
                date: date.date,
              },
            ]
          }
          return [
            {
              type: date.dateType,
              date: date.date,
            },
          ]
        })
    )
  }
}
