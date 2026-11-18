import { Request, Response } from 'express'
import UnusedDeductionsDetailController from './UnusedDeductionsDetailController'
import ComparisonService from '../../services/comparisonService'

jest.mock('../../services/comparisonService')

describe('UnusedDeductionsDetailController', () => {
  const comparisonService = new ComparisonService(null, null) as jest.Mocked<ComparisonService>
  const controller = new UnusedDeductionsDetailController(comparisonService)

  it('excludes existing unused deductions from the adjustments used in the calculation', async () => {
    const comparison = { comparisonShortReference: 'ABC123' }
    comparisonService.getUnusedDeductionsComparisonPerson.mockResolvedValue({
      comparison,
      person: { personShortReference: 'P1' },
      adjustments: [
        { adjustmentType: 'REMAND', days: 5 },
        { adjustmentType: 'UNUSED_DEDUCTIONS', days: 10 },
        { adjustmentType: 'TAGGED_BAIL', days: 3 },
      ],
      validationMessages: [],
    } as never)
    const render = jest.fn()
    const res = { locals: { user: { username: 'user1' } }, render } as unknown as Response
    const req = { params: { comparisonId: 'ABC123', personId: 'P1' } } as unknown as Request

    await controller.GET(req, res)

    expect(comparisonService.getUnusedDeductionsComparisonPerson).toHaveBeenCalledWith('ABC123', 'P1', 'user1')
    const [view, model] = render.mock.calls[0]
    expect(view).toBe('pages/compare/unusedDeductions/detail')
    expect(model.comparison).toBe(comparison)
    expect(model.detail.adjustments).toEqual([
      { adjustmentType: 'REMAND', days: 5 },
      { adjustmentType: 'TAGGED_BAIL', days: 3 },
    ])
  })
})
