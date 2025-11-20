import { previouslyRecordedSledSchema } from './previouslyRecordedSledSchema'
import { deduplicateFieldErrors } from '../../middleware/validationMiddleware'

describe('previouslyRecordedSledSchema', () => {
  type Form = {
    usePreviouslyRecordedSLED?: string
  }
  it('should require an option', async () => {
    // Given
    const form = {}

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      usePreviouslyRecordedSLED: ['You must select either yes or no.'],
    })
  })

  it.each(['YES', 'NO'])('should accept yes or no', async (usePreviouslyRecordedSLED: string) => {
    // Given
    const form = { usePreviouslyRecordedSLED }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(true)
    expect(result.data).toStrictEqual({ usePreviouslyRecordedSLED })
  })

  const doValidate = async (form: Form) => {
    return previouslyRecordedSledSchema.safeParse(form)
  }
})
