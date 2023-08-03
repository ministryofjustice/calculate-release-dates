import { CalculationUserInputs, ManualEntryDate } from '../calculateReleaseDates/calculateReleaseDatesClientTypes'

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
