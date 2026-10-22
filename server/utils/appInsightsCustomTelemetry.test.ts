import jwt from 'jsonwebtoken'
import { telemetry } from '@ministryofjustice/hmpps-azure-telemetry'
import type { Request, Response } from 'express'
import addUsernameAndCaseloadToTelemetry from './appInsightsCustomTelemetry'

jest.mock('@ministryofjustice/hmpps-azure-telemetry', () => ({
  telemetry: { setSpanAttributes: jest.fn() },
}))

const createToken = (payload: object) => jwt.sign(payload, 'secret', { expiresIn: '1h' })

describe('addUsernameAndCaseloadToTelemetry', () => {
  const next = jest.fn()

  const run = (user: object | undefined, req: object = {}) =>
    addUsernameAndCaseloadToTelemetry()(req as Request, { locals: { user } } as unknown as Response, next)

  beforeEach(() => jest.clearAllMocks())

  it('sets username, user_uuid and caseloadId', () => {
    run({ username: 'user1', token: createToken({ user_uuid: 'abc-123' }) }, { prisoner: { agencyId: 'MDI' } })

    expect(telemetry.setSpanAttributes).toHaveBeenCalledWith({
      username: 'user1',
      user_uuid: 'abc-123',
      caseloadId: 'MDI',
    })
    expect(next).toHaveBeenCalled()
  })

  it('omits user_uuid when the token has no user_uuid claim', () => {
    run({ username: 'user1', token: createToken({}) })

    expect(telemetry.setSpanAttributes).toHaveBeenCalledWith({ username: 'user1' })
  })

  it('omits user_uuid when the token cannot be decoded', () => {
    run({ username: 'user1', token: 'not-a-jwt' })

    expect(telemetry.setSpanAttributes).toHaveBeenCalledWith({ username: 'user1' })
    expect(next).toHaveBeenCalled()
  })

  it('sets nothing when there is no user', () => {
    run(undefined)

    expect(telemetry.setSpanAttributes).toHaveBeenCalledWith({})
    expect(next).toHaveBeenCalled()
  })
})
