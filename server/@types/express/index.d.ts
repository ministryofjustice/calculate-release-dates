import { CalculationUserInputs, ManualEntryDate } from '../calculateReleaseDates/calculateReleaseDatesClientTypes'
import type { UserDetails } from '../../services/userService'

export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    userInputs?: { string?: CalculationUserInputs }
    selectedManualEntryDates?: { string?: ManualEntryDate[] }
    selectedApprovedDates?: { string?: ManualEntryDate[] }
    HDCED?: { string?: string }
    HDCED_WEEKEND_ADJUSTED?: { string?: boolean }
    calculationReasonId?: { string?: number }
    otherReasonDescription?: { string?: string }
  }
}

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
    }
  }
}
