import { getApprovedDatePreviousDateUrl, getApprovedDatesNextAction } from './approvedDatesUtils'

describe('approvedDatesUtils', () => {
  describe('getApprovedDatePreviousDateUrl', () => {
    it('should return select dates URL if this is the first date', () => {
      expect(
        getApprovedDatePreviousDateUrl('A1234BC', '1234', 'HDCAD', [{ type: 'HDCAD' }, { type: 'ROTL' }]),
      ).toStrictEqual('/approved-dates/A1234BC/select-dates/1234')
    })
    it('should return previous date URL if this is not the first date', () => {
      expect(
        getApprovedDatePreviousDateUrl('A1234BC', '1234', 'ROTL', [{ type: 'HDCAD' }, { type: 'ROTL' }]),
      ).toStrictEqual('/approved-dates/A1234BC/HDCAD/add/1234')
    })
    it('should return select dates URL we can not find the date', () => {
      expect(
        getApprovedDatePreviousDateUrl('A1234BC', '1234', 'FOO', [{ type: 'HDCAD' }, { type: 'ROTL' }]),
      ).toStrictEqual('/approved-dates/A1234BC/select-dates/1234')
    })
  })
  describe('getApprovedDatesNextAction', () => {
    it('should get next date if we are not on the last date', () => {
      expect(
        getApprovedDatesNextAction('A1234BC', '1234', 'HDCAD', [{ type: 'HDCAD' }, { type: 'ROTL' }]),
      ).toStrictEqual({ action: 'NEXT_DATE', url: '/approved-dates/A1234BC/ROTL/add/1234' })
    })
    it('should get review dates screen with save action if we are on the last date', () => {
      expect(
        getApprovedDatesNextAction('A1234BC', '1234', 'ROTL', [{ type: 'HDCAD' }, { type: 'ROTL' }]),
      ).toStrictEqual({ action: 'SAVE_ALL_DATES', url: '/approved-dates/A1234BC/review-approved-dates/1234' })
    })
  })
})
