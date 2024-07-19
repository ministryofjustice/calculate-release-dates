import dayjs from 'dayjs'
import CalculationSummaryViewModel from './CalculationSummaryViewModel'
import config from '../config'

describe('CalculationSummaryViewModel', () => {
  describe('displayHdc4PlusNotificationBanner', () => {
    afterEach(() => {
      config.featureToggles.hdc4BannerEnabled = true
    })

    function createModel(dates) {
      return new CalculationSummaryViewModel(
        123,
        'ABC132',
        null,
        null,
        false,
        false,
        'Abc',
        { id: 1, displayName: 'Other', isOther: true },
        '',
        '2024-01-01',
        undefined,
        [],
        null,
        false,
        {},
        null,
        {
          dates,
          context: {
            calculationRequestId: 123,
            calculationReference: '123',
            prisonerId: 'A1234AB',
            bookingId: 1234,
            calculationStatus: 'CONFIRMED',
            calculationType: 'CALCULATED',
          },
          calculationOriginalData: {},
          calculationBreakdown: undefined,
          approvedDates: {},
          tranche: 'TRANCHE_1',
        },
      )
    }

    it('should return false if feature toggle off with HDCED', () => {
      config.featureToggles.hdc4BannerEnabled = false
      const modelWithDates = createModel({
        HDCED: {
          date: dayjs().add(3, 'day').format('YYYY-MM-DD'),
          type: 'HDCED',
          description: 'Home detention curfew eligibility date',
          hints: [{ text: 'Wednesday, 28 December 2016 when adjusted to a working day' }],
        },
      })
      expect(modelWithDates.displayHdc4PlusNotificationBanner()).toBe(false)
    })

    it('should return true if feature toggle on with HDCED', () => {
      config.featureToggles.hdc4BannerEnabled = true
      const modelWithDates = createModel({
        HDCED: {
          date: dayjs().add(3, 'day').format('YYYY-MM-DD'),
          type: 'HDCED',
          description: 'Home detention curfew eligibility date',
          hints: [{ text: 'Wednesday, 28 December 2016 when adjusted to a working day' }],
        },
      })
      expect(modelWithDates.displayHdc4PlusNotificationBanner()).toBe(true)
    })

    it('should return false if feature toggle on but no HDCED', () => {
      config.featureToggles.hdc4BannerEnabled = true
      const modelWithoutDates = createModel({})
      expect(modelWithoutDates.displayHdc4PlusNotificationBanner()).toBe(false)
    })

    it.each([
      ['TRANCHE_0', 'No applicable SDS40 Tranche'],
      ['TRANCHE_1', 'SDS40 Tranche 1'],
      ['TRANCHE_2', 'SDS40 Tranche 2'],
    ])('The SDS40 tranche text is set correctly', (tranche, expectedResult) => {
      const modelWithoutDates = createModel({})
      modelWithoutDates.detailedCalculationResults.tranche = tranche as 'TRANCHE_1' | 'TRANCHE_2' | 'TRANCHE_0'
      expect(modelWithoutDates.getSDSEarlyReleaseTranche()).toBe(expectedResult)
    })
  })
})
