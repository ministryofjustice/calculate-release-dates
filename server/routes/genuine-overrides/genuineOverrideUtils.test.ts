import { SessionData } from 'express-session'
import { Request } from 'express'
import { genuineOverrideInputsForPrisoner, sortDatesForGenuineOverride } from './genuineOverrideUtils'

describe('genuineOverrideUtils', () => {
  describe('genuineOverrideInputsForPrisoner', () => {
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
          genuineOverrideInputs: {
            A1234BC: {
              dates: [{ type: 'FOO', date: '2020-01-02' }],
              reason: 'OTHER',
              reasonFurtherDetail: 'Foo',
            },
          },
        } as Partial<SessionData>,
      } as Request
      const inputs = genuineOverrideInputsForPrisoner(req, 'A1234BC')
      expect(inputs).toStrictEqual({
        dates: [{ type: 'FOO', date: '2020-01-02' }],
        reason: 'OTHER',
        reasonFurtherDetail: 'Foo',
      })
    })
  })
  describe('sort dates', () => {
    it('should sort dates based on filtered list', () => {
      const dates = [
        { type: 'HDCED', date: '2021-10-03' },
        { type: 'SED', date: '2021-02-03' },
        { type: 'ERSED', date: '2020-02-03' },
        { type: 'CRD', date: '2021-02-04' },
      ]
      const result = sortDatesForGenuineOverride(dates)
      expect(dates).toStrictEqual(result)
      expect(dates).toStrictEqual([
        { type: 'SED', date: '2021-02-03' },
        { type: 'CRD', date: '2021-02-04' },
        { type: 'HDCED', date: '2021-10-03' },
        { type: 'ERSED', date: '2020-02-03' },
      ])
    })
  })
})
