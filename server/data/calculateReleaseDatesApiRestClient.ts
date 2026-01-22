import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import {
  BookingCalculation,
  CalculationBreakdown,
  CalculationReason,
  CalculationRequestModel,
  GenuineOverrideReason,
  WorkingDay,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import logger from '../../logger'

export default class CalculateReleaseDatesApiRestClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Calculate release dates API', config.apis.calculateReleaseDates, logger, authenticationClient)
  }

  calculatePreliminaryReleaseDates(
    prisonerId: string,
    calculationRequestModel: CalculationRequestModel,
    username: string,
  ): Promise<BookingCalculation> {
    return this.post<BookingCalculation>(
      {
        path: `/calculation/${prisonerId}`,
        data: calculationRequestModel || null,
      },
      asSystem(username),
    )
  }

  getCalculationResults(calculationRequestId: number, username: string): Promise<BookingCalculation> {
    return this.get<BookingCalculation>(
      {
        path: `/calculation/results/${calculationRequestId}`,
      },
      asSystem(username),
    )
  }

  getCalculationBreakdown(calculationRequestId: number, username: string): Promise<CalculationBreakdown> {
    return this.get<CalculationBreakdown>(
      {
        path: `/calculation/breakdown/${calculationRequestId}`,
      },
      asSystem(username),
    )
  }

  getNextWorkingDay(date: string, username: string): Promise<WorkingDay> {
    return this.get<WorkingDay>({ path: `/working-day/next/${date}` }, asSystem(username))
  }

  getCalculationReasons(username: string): Promise<CalculationReason[]> {
    return this.get<CalculationReason[]>({ path: `/calculation-reasons/` }, asSystem(username))
  }

  getGenuineOverrideReasons(username: string): Promise<GenuineOverrideReason[]> {
    return this.get<GenuineOverrideReason[]>({ path: `/genuine-override/reasons` }, asSystem(username))
  }
}
