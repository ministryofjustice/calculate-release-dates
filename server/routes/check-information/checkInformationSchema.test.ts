import { checkInformationSchema } from './checkInformationSchema'

describe('checkInformationSchema', () => {
  type Form = {
    ersed?: string
  }
  it('should default to false if no ersed specified', async () => {
    // Given
    const form = {}

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(true)
    expect(result.data).toStrictEqual({ ersed: false })
  })

  it('should set to true if ersed specified', async () => {
    // Given
    const form = { ersed: 'true' }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(true)
    expect(result.data).toStrictEqual({ ersed: true })
  })

  const doValidate = async (form: Form) => {
    return checkInformationSchema.safeParse(form)
  }
})
