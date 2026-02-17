import { Request, RequestHandler } from 'express'
import logger from '../../logger'
import { PersonJourneyParams } from '../@types/journeys'

export default function ensureInApprovedDatesJourney(): RequestHandler {
  return (req: Request<PersonJourneyParams>, res, next) => {
    const { journeyId, nomsId } = req.params
    if (!req.session.approvedDatesJourneys) {
      req.session.approvedDatesJourneys = {}
    }
    if (!req.session.approvedDatesJourneys[journeyId]) {
      logger.warn(
        `Approved dates journey (${journeyId}) not found in session for user ${res.locals.user?.username}. Returning to start of journey.`,
      )
      return res.redirect(`/approved-dates/${nomsId}/start`)
    }
    req.session.approvedDatesJourneys[journeyId].lastTouched = new Date().toISOString()
    return next()
  }
}
