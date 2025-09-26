import { deduplicateFieldErrors } from '../../middleware/validationMiddleware'
import { releaseDateSchema } from './releaseDateSchemas'

describe('releaseDateSchema', () => {
  type Form = {
    day?: string
    month?: string
    year?: string
  }

  it('Should return a top level error if no fields are provided', async () => {
    // Given
    const form = {}

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      day: ['Enter the date'],
      month: [''],
      year: [''],
    })
  })

  it('Should return a single error if missing day', async () => {
    // Given
    const form = { month: '1', year: '2000' }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      day: ['The date must include a day'],
    })
  })

  it('Should return a single error if missing month', async () => {
    // Given
    const form = { day: '1', year: '2000' }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      month: ['The date must include a month'],
    })
  })

  it('Should return a single error if missing year', async () => {
    // Given
    const form = { day: '1', month: '12' }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      year: ['The date must include a year'],
    })
  })

  it.each([
    ['', '', '2000', 'day', 'The date must include a day and a month', 'month'],
    ['', '2', '', 'day', 'The date must include a day and a year', 'year'],
    ['1', '', '', 'month', 'The date must include a month and a year', 'year'],
  ])(
    'Should return a combined error if two fields are missing and blank error for secondary field so it is highlighted',
    async (day, month, year, expectedFieldWithMessage, expectedMessage, expectedFieldWithBlankMessage) => {
      // Given
      const form = { day, month, year }

      // When
      const result = await doValidate(form)

      // Then
      const expected: { [key: string]: string[] } = {}
      expected[expectedFieldWithMessage] = [expectedMessage]
      expected[expectedFieldWithBlankMessage] = ['']

      expect(result.success).toStrictEqual(false)
      const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
      expect(deduplicatedFieldErrors).toStrictEqual(expected)
    },
  )

  it('Should return a combined error if day and month are missing and a separate message if year is invalid', async () => {
    // Given
    const form = { day: '', month: '', year: '98' }

    // When
    const result = await doValidate(form)

    // Then

    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      day: ['The date must include a day and a month'],
      month: [''],
      year: ['Year must include 4 numbers'],
    })
  })

  it('Should return a single error if year is not 4 chars', async () => {
    // Given
    const form = { day: '1', month: '12', year: '99' }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      year: ['Year must include 4 numbers'],
    })
  })

  it.each([
    ['xx', '12', '2000'],
    ['1', 'xx', '2000'],
    ['1', '12', 'xxxx'],
    ['1', 'xx', 'xxxx'],
    ['xx', 'xx', '2000'],
    ['xx', '12', 'xxxx'],
    ['xx', 'xx', 'xxxx'],
  ])('Should return a single error if date is not parseable (%s, %s, %s)', async (day, month, year) => {
    // Given
    const form = { day, month, year }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      day: ['The date must be a real date'],
      month: [''],
      year: [''],
    })
  })

  it.each([
    ['29', '02', '2023'], // 2023 was not a leap year
    ['32', '01', '2000'],
    ['15', '99', '2000'],
    ['15', '000006', '2000'],
  ])('Should return a single error if date is not a valid date', async (day, month, year) => {
    // Given
    const form = { day, month, year }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(false)
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error!)
    expect(deduplicatedFieldErrors).toStrictEqual({
      day: ['The date must be a real date'],
      month: [''],
      year: [''],
    })
  })

  it.each([
    ['29', '02', '1980'], // 1980 was a leap year
    ['01', '02', '2000'], // padded day and month
    ['1', '2', '2000'], // no padding
  ])('Should allow valid dates in various formats (%s, %s, %s)', async (day, month, year) => {
    // Given
    const form = { day, month, year }

    // When
    const result = await doValidate(form)

    // Then
    expect(result.success).toStrictEqual(true)
  })

  const doValidate = async (form: Form) => {
    return releaseDateSchema.safeParse(form)
  }
})
