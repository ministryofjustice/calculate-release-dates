import type { Request, Response } from 'express'
import AuthorisedRoles from '../enumerations/authorisedRoles'
import requireGenuineOverrideAccess from './requireGenuineOverrideAccess'

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

  it('should return next when the user has the required role', () => {
    const res = createResWithToken({
      userRoles: [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR, AuthorisedRoles.ROLE_CRD__GENUINE_OVERRIDES__RW],
    })

    requireGenuineOverrideAccess()(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  it('should redirect when user does not have the required roles', () => {
    const res = createResWithToken({ userRoles: [AuthorisedRoles.ROLE_RELEASE_DATES_CALCULATOR] })

    requireGenuineOverrideAccess()(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith('/authError')
  })
})
