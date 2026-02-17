import { deleteDateSchema } from './deleteDateSchema'
import { deduplicateFieldErrors } from '../../middleware/validationMiddleware'

describe('deleteDateSchema', () => {
  type Form = {
    confirmDeleteDate?: string
  }
  it('should require agreeing with deleting the date', async () => {
    // Given
    const form = {}

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      confirmDeleteDate: ['You must select either yes or no.'],
    })
  })

  it.each(['YES', 'NO'])('should accept yes or no', async (confirmDeleteDate: string) => {
    // Given
    const form = { confirmDeleteDate }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(true)
    expect(result.data).toStrictEqual({ confirmDeleteDate })
  })

  const doValidate = async (form: Form) => {
    return deleteDateSchema.safeParse(form)
  }
})
