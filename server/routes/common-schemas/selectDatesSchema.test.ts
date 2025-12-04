import { deduplicateFieldErrors } from '../../middleware/validationMiddleware'
import { selectDatesSchema } from './selectDatesSchema'

describe('selectDatesSchema', () => {
  type Form = {
    dateType?: string[] | string
  }
  it('should require at least one date no form', async () => {
    // Given
    const form = {}

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      dateType: ['You must select at least one date'],
    })
  })

  it('should require at least one date empty array', async () => {
    // Given
    const form = { dateType: [] }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      dateType: ['You must select at least one date'],
    })
  })

  it('should include all date types from the form', async () => {
    // Given
    const form = { dateType: ['CRD', 'SLED'] }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(true)
    expect(result.data).toStrictEqual({ dateType: ['CRD', 'SLED'] })
  })

  it('should include handle only one date being selected which does not arrive as an array', async () => {
    // Given
    const form = { dateType: 'CRD' }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(true)
    expect(result.data).toStrictEqual({ dateType: ['CRD'] })
  })

  const doValidate = async (form: Form) => {
    return selectDatesSchema.safeParse(form)
  }
})
