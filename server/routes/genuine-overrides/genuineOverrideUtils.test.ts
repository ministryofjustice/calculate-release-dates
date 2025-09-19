import { SessionData } from 'express-session'
import { Request } from 'express'
import genuineOverrideInputsForPrisoner from './genuineOverrideUtils'

describe('genuineOverrideUtils', () => {
  it('should initialise global list of genuine override inputs if there are none', () => {
    const req = { session: {} as Partial<SessionData> } as Request
    const inputs = genuineOverrideInputsForPrisoner(req, 'A1234BC')
    expect(inputs).toStrictEqual({})
  })

  it('should initialise properties for prisoner if there are none', () => {
    const req = { session: { genuineOverrideInputs: {} } as Partial<SessionData> } as Request
    const inputs = genuineOverrideInputsForPrisoner(req, 'A1234BC')
    expect(inputs).toStrictEqual({})
  })

  it('should get existing properties for prisoner if there are some', () => {
    const req = {
      session: {
        genuineOverrideInputs: { A1234BC: { reason: 'OTHER', reasonFurtherDetail: 'Foo' } },
      } as Partial<SessionData>,
    } as Request
    const inputs = genuineOverrideInputsForPrisoner(req, 'A1234BC')
    expect(inputs).toStrictEqual({ reason: 'OTHER', reasonFurtherDetail: 'Foo' })
  })
})
