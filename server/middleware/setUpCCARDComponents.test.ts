import type { Request, Response } from 'express'

import { ServiceHeaderConfig } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
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

  it('should add default service header config with just env in so any page not specifying a model gets the correct service header link', () => {
    const res = createResWithToken({ roles: [] })
    setUpCCARDComponents()(req, res, next)
    expect(res.locals.defaultServiceHeaderConfig).toStrictEqual({ environment: 'prod' } as ServiceHeaderConfig)
    expect(next).toHaveBeenCalled()
  })
})
