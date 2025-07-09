import CalculationSummaryViewModel from './CalculationSummaryViewModel'

describe('CalculationSummaryViewModel', () => {
  describe('SDS40 release tranche label', () => {
    function createModel(dates) {
      return new CalculationSummaryViewModel(
        123,
        'ABC132',
        null,
        null,
        false,
        false,
        'CALCULATED',
        'Abc',
        false,
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

    it.each([
      ['TRANCHE_0', 'No SDS40 Tranche'],
      ['TRANCHE_1', 'SDS40 Tranche 1'],
      ['TRANCHE_2', 'SDS40 Tranche 2'],
    ])('The SDS40 tranche text is set correctly', (tranche, expectedResult) => {
      const modelWithoutDates = createModel({})
      modelWithoutDates.detailedCalculationResults.tranche = tranche as 'TRANCHE_1' | 'TRANCHE_2' | 'TRANCHE_0'
      expect(modelWithoutDates.getSDS40ReleaseTranche()).toBe(expectedResult)
    })
  })
})
