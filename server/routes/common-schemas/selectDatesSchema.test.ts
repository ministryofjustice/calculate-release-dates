import { selectDatesSchema } from './selectDatesSchema'

describe('selectDatesSchema', () => {
  type Form = {
    dateType?: string[] | string
  }
  it('should not require any date empty form', async () => {
    // Given
    const form = {}

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(true)
    expect(result.data).toStrictEqual({ dateType: [] })
  })

  it('should not require any date empty array', async () => {
    // Given
    const form = { dateType: [] }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(true)
    expect(result.data).toStrictEqual({ dateType: [] })
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

  it('should handle only one date being selected which does not arrive as an array', async () => {
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
