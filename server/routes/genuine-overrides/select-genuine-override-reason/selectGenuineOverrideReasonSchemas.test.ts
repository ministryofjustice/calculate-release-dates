import { deduplicateFieldErrors } from '../../../middleware/validationMiddleware'
import { selectGenuineOverrideReasonSchemaFactory } from './selectGenuineOverrideReasonSchemas'

describe('selectGenuineOverrideReasonSchemaFactory', () => {
  type Form = {
    reason?: string
  }
  it('should require the reason', async () => {
    // Given
    const form = {}

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      reason: ['You must select a reason for the override'],
    })
  })

  it('should require further detail if the selected reason is OTHER', async () => {
    // Given
    const form = { reason: 'OTHER' }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      reasonFurtherDetail: ['Enter the reason this calculation is incorrect'],
    })
  })

  it('should reject further detail if more than 120 chars', async () => {
    // Given
    const form = { reason: 'OTHER', reasonFurtherDetail: 'x'.padStart(121, 'x') }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      reasonFurtherDetail: ['The reason this calculation is incorrect must be 120 characters or less'],
    })
  })

  it('should include further detail if the reason requires it', async () => {
    // Given
    const form = { reason: 'OTHER', reasonFurtherDetail: 'Some deets' }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(true)
    expect(result.data).toStrictEqual({ reason: 'OTHER', reasonFurtherDetail: 'Some deets' })
  })

  it('should remove further detail if the reason does not require it', async () => {
    // Given
    const form = { reason: 'UNSUPPORTED_SENTENCES', reasonFurtherDetail: 'Some deets' }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(true)
    expect(result.data).toStrictEqual({ reason: 'UNSUPPORTED_SENTENCES' })
  })

  const doValidate = async (form: Form) => {
    return selectGenuineOverrideReasonSchemaFactory.safeParse(form)
  }
})
