import { CalculationUserInputs } from '../calculateReleaseDates/calculateReleaseDatesClientTypes'
import type { UserDetails } from '../../services/userService'
import { ErrorMessages } from '../../types/ErrorMessages'
import { ManualJourneySelectedDate } from '../../types/ManualJourney'
import { ApprovedDatesJourney, GenuineOverrideInputs } from '../journeys'

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    userInputs?: { string?: CalculationUserInputs }
    selectedManualEntryDates?: { string?: ManualJourneySelectedDate[] }
    selectedApprovedDates?: { string?: ManualJourneySelectedDate[] }
    HDCED?: { string?: string }
    HDCED_WEEKEND_ADJUSTED?: { string?: boolean }
    calculationReasonId?: { string?: number }
    unchangedManualJourney?: boolean
    manualJourneyDifferentDatesConfirmed?: boolean
    otherReasonDescription?: { string?: string }
    manualEntryValidationErrors?: ErrorMessages
    isAddDatesFlow?: boolean
    manualEntryRoutingForBookings?: [string]
    genuineOverrideInputs: Record<string, GenuineOverrideInputs>
    siblingCalculationWithPreviouslyRecordedSLED?: { number?: number }
    approvedDatesJourneys: Record<string, ApprovedDatesJourney>
  }
}

// eslint-disable-next-line import/prefer-default-export
export declare global {
  namespace Express {
    interface User extends Partial<UserDetails> {
      token: string
      authSource: string
      userRoles: string[]
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
    }

    interface Locals {
      user: Express.User
      validationErrors?: fieldErrors
    }
  }
}
