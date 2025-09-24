import { deduplicateFieldErrors } from '../../middleware/validationMiddleware'
import { calculationSummarySchema } from './calculationSummarySchema'

describe('calculationSummarySchema', () => {
  type Form = {
    agreeWithDates?: string
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
      agreeWithDates: ['You must select either yes or no.'],
    })
  })

  it.each(['YES', 'NO'])('should accept yes or no', async (agreeWithDates: string) => {
    // Given
    const form = { agreeWithDates }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(true)
    expect(result.data).toStrictEqual({ agreeWithDates })
  })

  const doValidate = async (form: Form) => {
    return calculationSummarySchema.safeParse(form)
  }
})
