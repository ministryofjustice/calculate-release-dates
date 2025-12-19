import type { Request, Response } from 'express'
import AuthorisedRoles from '../enumerations/authorisedRoles'
import requireGenuineOverrideAccess from './requireGenuineOverrideAccess'
import config from '../config'

describe('requireGenuineOverrideAccess', () => {
  let req: Request
  const next = jest.fn()

  function createResWithToken({ userRoles }: { userRoles: string[] }): Response {
    return {
      locals: {
        user: {
          userRoles,
        },
      },
      redirect: jest.fn(),
    } as unknown as Response
  }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  afterEach(() => {
    config.featureToggles.genuineOverridesEnabled = true
  })

  it('should return next when the feature toggle is on', () => {
    config.featureToggles.genuineOverridesEnabled = true
    const res = createResWithToken({
      userRoles: [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR, AuthorisedRoles.ROLE_CRD__GENUINE_OVERRIDES__RW],
    })

    requireGenuineOverrideAccess()(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  it('should redirect when feature toggle is off', () => {
    config.featureToggles.genuineOverridesEnabled = false
    const res = createResWithToken({ userRoles: [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR] })

    requireGenuineOverrideAccess()(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith('/authError')
  })
})
