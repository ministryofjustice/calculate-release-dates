import { CalculationUserInputs } from '../calculateReleaseDates/calculateReleaseDatesClientTypes'
import { ManualEntrySelectedDate } from '../../models/ManualEntrySelectedDate'

export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    userInputs?: { string?: CalculationUserInputs }
    selectedManualEntryDates?: { string?: ManualEntrySelectedDate[] }
  }
}

export declare global {
  namespace Express {
    interface User {
      username: string
      token: string
      authSource: string
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
    }
  }
}
