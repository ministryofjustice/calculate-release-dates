import { deduplicateFieldErrors } from '../../../middleware/validationMiddleware'
import { selectGenuineOverrideReasonSchemaFactory, isValidReason } from './selectGenuineOverrideReasonSchemas'

describe('isValidReason', () => {
  it('should return false for null input', () => {
    expect(isValidReason(null)).toBe(false)
  })

  it('should return false for undefined input', () => {
    expect(isValidReason(undefined as unknown as string)).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isValidReason('')).toBe(false)
  })

  it('should return false for input with only spaces', () => {
    expect(isValidReason('   ')).toBe(false)
  })

  it('should return false for input with only filler words', () => {
    expect(isValidReason('na')).toBe(false)
    expect(isValidReason('n a')).toBe(false)
    expect(isValidReason('other')).toBe(false)
    expect(isValidReason('na other')).toBe(false)
  })

  it('should return false for input with only special characters', () => {
    expect(isValidReason('!@#$%^&*()')).toBe(false)
  })

  it('should return true for valid input with meaningful content', () => {
    expect(isValidReason('This is valid')).toBe(true)
    expect(isValidReason('FTR-56')).toBe(true)
    expect(isValidReason('UAL')).toBe(true)
  })

  it('should return true for input with filler words but enough meaningful content', () => {
    expect(isValidReason('na valid reason')).toBe(true)
    expect(isValidReason('other valid reason')).toBe(true)
  })

  it('should return false for input with less than 2 meaningful characters', () => {
    expect(isValidReason('a')).toBe(false)
    expect(isValidReason('n a')).toBe(false)
  })
})

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
