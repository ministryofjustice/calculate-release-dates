import { calculationReasonSchemaFactory } from './calculationReasonSchemaFactory'
import { deduplicateFieldErrors } from '../../middleware/validationMiddleware'

describe('calculationReasonSchemaFactory', () => {
  type Form = {
    calculationReasonId?: string
    reasons?: { id: string; requiresFurtherDetail: string; furtherDetail?: string }[]
  }

  it('should require the reason', async () => {
    // Given
    const reasons = [
      { id: '1', requiresFurtherDetail: 'false' },
      { id: '2', requiresFurtherDetail: 'true', furtherDetail: 'some detail' },
    ]
    const form = { reasons }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      calculationReasonId: ['You must select a reason for this calculation'],
    })
  })

  it('should require further detail if the selected reason is one that requires it', async () => {
    // Given
    const reasons = [
      { id: '1', requiresFurtherDetail: 'false' },
      { id: '2', requiresFurtherDetail: 'true', furtherDetail: '' },
    ]
    const form = { calculationReasonId: '2', reasons }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      reasons_2_furtherDetail: ['Enter the reason for this calculation'],
    })
  })

  it('should not require further detail if the selected reason is one that does not require it', async () => {
    // Given
    const reasons = [
      { id: '1', requiresFurtherDetail: 'false' },
      { id: '2', requiresFurtherDetail: 'true' },
    ]
    const form = { calculationReasonId: '1', reasons }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(true)
  })

  it('should reject further detail if more than 120 chars', async () => {
    // Given
    const reasons = [
      { id: '1', requiresFurtherDetail: 'false' },
      { id: '2', requiresFurtherDetail: 'true', furtherDetail: 'x'.padStart(121, 'x') },
    ]
    const form = { calculationReasonId: '2', reasons }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      reasons_2_furtherDetail: ['The reason for this calculation must be 120 characters or less'],
    })
  })

  it('should include further detail if the reason requires it', async () => {
    // Given
    const reasons = [
      { id: '1', requiresFurtherDetail: 'false' },
      { id: '2', requiresFurtherDetail: 'true', furtherDetail: 'some details' },
      { id: '3', requiresFurtherDetail: 'true', furtherDetail: 'other details' },
    ]
    const form = { calculationReasonId: '2', reasons }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(true)
    expect(result.data).toStrictEqual({
      calculationReasonId: 2,
      furtherDetail: 'some details',
    })
  })

  it('should remove further detail if the reason does not require it', async () => {
    // Given
    const reasons = [
      { id: '1', requiresFurtherDetail: 'false' },
      { id: '2', requiresFurtherDetail: 'true', furtherDetail: 'some details' },
      { id: '3', requiresFurtherDetail: 'true', furtherDetail: 'other details' },
    ]
    const form = { calculationReasonId: '1', reasons }

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
