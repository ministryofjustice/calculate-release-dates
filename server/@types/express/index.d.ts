import { CalculationUserInputs } from '../calculateReleaseDates/calculateReleaseDatesClientTypes'
import type { UserDetails } from '../../services/userService'
import { ErrorMessages } from '../../types/ErrorMessages'
import { ManualJourneySelectedDate } from '../../types/ManualJourney'
import { ApprovedDatesJourney, GenuineOverrideInputs } from '../journeys'
import { PrisonApiPrisoner } from '../prisonApi/prisonClientTypes'

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    userInputs?: Record<string, CalculationUserInputs>
    selectedManualEntryDates?: Record<string, ManualJourneySelectedDate[]>
    selectedApprovedDates?: Record<string, ManualJourneySelectedDate[]>
    HDCED?: Record<string, string>
    HDCED_WEEKEND_ADJUSTED?: Record<string, boolean>
    calculationReasonId?: Record<string, number>
    unchangedManualJourney?: boolean
    manualJourneyDifferentDatesConfirmed?: boolean
    otherReasonDescription?: Record<string, string>
    manualEntryValidationErrors?: ErrorMessages
    isAddDatesFlow?: Record<string, boolean>
    manualEntryRoutingForBookings?: string[]
    genuineOverrideInputs: Record<string, GenuineOverrideInputs>
    siblingCalculationWithPreviouslyRecordedSLED?: Record<number, number>
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
      prisoner?: PrisonApiPrisoner
    }

    interface Locals {
      user: Express.User
      validationErrors?: fieldErrors
    }
  }
}
