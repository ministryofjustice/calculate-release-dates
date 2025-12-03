import { v4 as uuidv4 } from 'uuid'
import { Request as ExpressRequest, Response } from 'express'
import { SessionData } from 'express-session'
import ensureInApprovedDatesJourney from './approvedDatesMiddleware'
import { user } from '../routes/testutils/appSetup'
import { PersonJourneyParams } from '../@types/journeys'

type Request = ExpressRequest<PersonJourneyParams>

describe('journeyMiddleware', () => {
  describe('ensureInApprovedDatesJourney', () => {
    const journeyId = uuidv4()
    const nomsId = 'A1234BC'
    let req: Request
    let res: Response
    beforeEach(() => {
      req = {
        params: { journeyId, nomsId },
        session: {} as Partial<SessionData>,
      } as unknown as Request
      res = { redirect: jest.fn(), locals: { user } } as unknown as Response
    })

    it('should proceed if the journey is in the session and update the last touched date', () => {
      const next = jest.fn()
      const lastTouchedBeforeCall = new Date(2020, 1, 1)
      req.session.approvedDatesJourneys = {}
      req.session.approvedDatesJourneys[journeyId] = {
        id: journeyId,
        lastTouched: lastTouchedBeforeCall.toISOString(),
        nomsId,
        preliminaryCalculationRequestId: 1234,
        datesToSave: [],
        datesBeingAdded: [],
      }
      ensureInApprovedDatesJourney()(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(new Date(req.session.approvedDatesJourneys[journeyId].lastTouched).getTime()).toBeGreaterThan(
        lastTouchedBeforeCall.getTime(),
      )
    })
    it('should return to start if the journey is not in the session', () => {
      const next = jest.fn()
      req.session.approvedDatesJourneys = {}
      ensureInApprovedDatesJourney()(req, res, next)
      expect(next).toHaveBeenCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith(`/approved-dates/${nomsId}/start`)
    })
    it('should return to start if no journeys created at all', () => {
      const next = jest.fn()
      ensureInApprovedDatesJourney()(req, res, next)
      expect(next).toHaveBeenCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith(`/approved-dates/${nomsId}/start`)
    })
  })
})
