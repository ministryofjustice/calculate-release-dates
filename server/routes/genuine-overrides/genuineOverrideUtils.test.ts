import { SessionData } from 'express-session'
import { Request } from 'express'
import {
  genuineOverrideInputsForPrisoner,
  getGenuineOverrideNextAction,
  getGenuineOverridePreviousDateUrl,
  hasGenuineOverridesAccess,
} from './genuineOverrideUtils'
import config from '../../config'
import AuthorisedRoles from '../../enumerations/authorisedRoles'

describe('genuineOverrideUtils', () => {
  afterEach(() => {
    config.featureToggles.genuineOverridesEnabled = false
  })
  describe('genuineOverrideInputsForPrisoner', () => {
    it('should blow up if the inputs have not been initialised at all', () => {
      const req = { session: {} as Partial<SessionData> } as Request
      try {
        genuineOverrideInputsForPrisoner(req, 'A1234BC')
        fail('Should have blown up')
      } catch (e) {
        expect(e.message).toStrictEqual(
          'No session state found for genuine override for prisoner A1234BC. Session may have expired',
        )
      }
    })

    it('should blow up if the inputs for the prisoner have not been initialised', () => {
      const req = { session: { genuineOverrideInputs: {} } as Partial<SessionData> } as Request
      try {
        genuineOverrideInputsForPrisoner(req, 'A1234BC')
        fail('Should have blown up')
      } catch (e) {
        expect(e.message).toStrictEqual(
          'No session state found for genuine override for prisoner A1234BC. Session may have expired',
        )
      }
    })

    it('should get existing properties for prisoner if there are some', () => {
      const req = {
        session: {
          genuineOverrideInputs: {
            A1234BC: {
              mode: 'STANDARD',
              datesToSave: [{ type: 'FOO', date: '2020-01-02' }],
              reason: 'OTHER',
              reasonFurtherDetail: 'Foo',
            },
          },
        } as Partial<SessionData>,
      } as Request
      const inputs = genuineOverrideInputsForPrisoner(req, 'A1234BC')
      expect(inputs).toStrictEqual({
        mode: 'STANDARD',
        datesToSave: [{ type: 'FOO', date: '2020-01-02' }],
        reason: 'OTHER',
        reasonFurtherDetail: 'Foo',
      })
    })
  })

  describe('hasGenuineOverridesAccess', () => {
    it('should allow genuine overrides if the user has role and feature toggle is enabled', () => {
      config.featureToggles.genuineOverridesEnabled = true
      expect(hasGenuineOverridesAccess([AuthorisedRoles.ROLE_CRD__GENUINE_OVERRIDES__RW])).toStrictEqual(true)
    })
    it('should not allow genuine overrides if the user has role but the feature toggle is disabled', () => {
      config.featureToggles.genuineOverridesEnabled = false
      expect(hasGenuineOverridesAccess([AuthorisedRoles.ROLE_CRD__GENUINE_OVERRIDES__RW])).toStrictEqual(false)
    })
    it('should not allow genuine overrides if the feature toggle is enabled but the user does not have the role', () => {
      config.featureToggles.genuineOverridesEnabled = true
      expect(hasGenuineOverridesAccess([])).toStrictEqual(false)
    })
  })
  describe('getGenuineOverridePreviousDateUrl', () => {
    it('should return select dates URL if this is the first date', () => {
      expect(
        getGenuineOverridePreviousDateUrl('A1234BC', '1234', 'HDCED', [{ type: 'HDCED' }, { type: 'TUSED' }]),
      ).toStrictEqual('/calculation/A1234BC/override/select-dates/1234')
    })
    it('should return previous date URL if this is not the first date', () => {
      expect(
        getGenuineOverridePreviousDateUrl('A1234BC', '1234', 'TUSED', [{ type: 'HDCED' }, { type: 'TUSED' }]),
      ).toStrictEqual('/calculation/A1234BC/override/HDCED/add/1234')
    })
    it('should return select dates URL we can not find the date', () => {
      expect(
        getGenuineOverridePreviousDateUrl('A1234BC', '1234', 'FOO', [{ type: 'HDCED' }, { type: 'TUSED' }]),
      ).toStrictEqual('/calculation/A1234BC/override/select-dates/1234')
    })
  })
  describe('getGenuineOverrideNextAction', () => {
    it('should get next date if we are not on the last date', () => {
      expect(
        getGenuineOverrideNextAction('A1234BC', '1234', 'HDCED', [{ type: 'HDCED' }, { type: 'TUSED' }]),
      ).toStrictEqual({ action: 'NEXT_DATE', url: '/calculation/A1234BC/override/TUSED/add/1234' })
    })
    it('should get review dates screen with save action if we are on the last date', () => {
      expect(
        getGenuineOverrideNextAction('A1234BC', '1234', 'TUSED', [{ type: 'HDCED' }, { type: 'TUSED' }]),
      ).toStrictEqual({ action: 'SAVE_ALL_DATES', url: '/calculation/A1234BC/review-dates-for-override/1234' })
    })
  })
})
