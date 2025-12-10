import { calculationReasonSchemaFactory } from './calculationReasonSchemaFactory'
import { deduplicateFieldErrors } from '../../middleware/validationMiddleware'

describe('calculationReasonSchemaFactory', () => {
  type Form = {
    calculationReasonId?: string
    otherReasonDescription?: string
    otherReasonId: string
  }
  it('should require the reason', async () => {
    // Given
    const form = { otherReasonId: '99' }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      calculationReasonId: ['You must select a reason for this calculation'],
    })
  })

  it('should require further detail if the selected reason is the other reason id', async () => {
    // Given
    const form = { calculationReasonId: '99', otherReasonId: '99' }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      otherReasonDescription: ['Enter the reason for this calculation'],
    })
  })

  it('should reject further detail if more than 120 chars', async () => {
    // Given
    const form = { calculationReasonId: '99', otherReasonId: '99', otherReasonDescription: 'x'.padStart(121, 'x') }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      otherReasonDescription: ['The reason for this calculation must be 120 characters or less'],
    })
  })

  it('should include further detail if the reason requires it', async () => {
    // Given
    const form = { calculationReasonId: '99', otherReasonId: '99', otherReasonDescription: 'Some deets' }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(true)
    expect(result.data).toStrictEqual({
      calculationReasonId: 99,
      otherReasonDescription: 'Some deets',
    })
  })

  it('should remove further detail if the reason does not require it', async () => {
    // Given
    const form = { calculationReasonId: '1', otherReasonId: '99', otherReasonDescription: 'Some deets' }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(true)
    expect(result.data).toStrictEqual({ calculationReasonId: 1 })
  })

  const doValidate = async (form: Form) => {
    return calculationReasonSchemaFactory.safeParse(form)
  }
})
