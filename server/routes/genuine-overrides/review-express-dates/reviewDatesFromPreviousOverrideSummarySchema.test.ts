import { deduplicateFieldErrors } from '../../../middleware/validationMiddleware'
import { reviewDatesFromPreviousOverrideSummarySchema } from './reviewDatesFromPreviousOverrideSummarySchema'

describe('reviewDatesFromPreviousOverrideSummarySchema', () => {
  type Form = {
    stillCorrect?: string
  }
  it('should require agreeing with the dates', async () => {
    // Given
    const form = {}

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      stillCorrect: ['You must select either yes or no.'],
    })
  })

  it.each(['YES', 'NO'])('should accept yes or no', async (stillCorrect: string) => {
    // Given
    const form = { stillCorrect }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(true)
    expect(result.data).toStrictEqual({ stillCorrect })
  })

  const doValidate = async (form: Form) => {
    return reviewDatesFromPreviousOverrideSummarySchema.safeParse(form)
  }
})
