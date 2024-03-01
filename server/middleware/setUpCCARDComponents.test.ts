import type { Request, Response } from 'express'

import setUpCCARDComponents from './setUpCCARDComponents'

describe('setUpCCARDComponents', () => {
  let req: Request
  const next = jest.fn()

  function createResWithToken({ roles }: { roles: string[] }): Response {
    return {
      locals: {
        user: {
          userRoles: roles,
        },
      },
      redirect: jest.fn(),
    } as unknown as Response
  }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should set showCCARDNav to false if user has access no relevant roles', () => {
    const res = createResWithToken({ roles: [] })

    setUpCCARDComponents()(req, res, next)
    expect(res.locals.showCCARDNav).toBeFalsy()
    expect(next).toHaveBeenCalled()
  })

  it('should set showCCARDNav to false if user has access to CRD only', () => {
    const res = createResWithToken({ roles: ['ROLE_RELEASE_DATES_CALCULATOR'] })

    setUpCCARDComponents()(req, res, next)
    expect(res.locals.showCCARDNav).toBeFalsy()
    expect(next).toHaveBeenCalled()
  })

  it('should set showCCARDNav to true if user has access to CRD and adjustments', () => {
    const res = createResWithToken({ roles: ['ROLE_RELEASE_DATES_CALCULATOR', 'ROLE_ADJUSTMENTS_MAINTAINER'] })

    setUpCCARDComponents()(req, res, next)
    expect(res.locals.showCCARDNav).toBeTruthy()
    expect(next).toHaveBeenCalled()
  })
})
