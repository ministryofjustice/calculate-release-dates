import { z } from 'zod'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { createSchema } from '../../middleware/validationMiddleware'

dayjs.extend(customParseFormat)

const DATE_IS_REQUIRED_MESSAGE = `Enter the date`
const SINGLE_FIELD_MISSING_ERROR = (field: string) => `The date must include a ${field}`
const TWO_FIELDS_MISSING_ERROR = (fieldOne: string, fieldTwo: string) =>
  `The date must include a ${fieldOne} and a ${fieldTwo}`
const YEAR_ERROR = 'Year must include 4 numbers'
const BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED = ''
const REAL_DATE_ERROR = `The date must be a real date`

export const releaseDateSchema = createSchema({
  day: z.string().trim().optional(),
  month: z.string().trim().optional(),
  year: z.string().trim().optional(),
})
  .superRefine((val, ctx) => {
    if (!val.day && !val.month && !val.year) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: DATE_IS_REQUIRED_MESSAGE, path: ['day'] })
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED, path: ['month'] })
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED, path: ['year'] })
    } else {
      const missing: string[] = []
      if (!val.day) {
        missing.push('day')
      }
      if (!val.month) {
        missing.push('month')
      }
      if (!val.year) {
        missing.push('year')
      }
      if (missing.length === 1) {
        const field = missing[0]!
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: SINGLE_FIELD_MISSING_ERROR(field), path: [field] })
      } else if (missing.length === 2) {
        const fieldOne = missing[0]!
        const fieldTwo = missing[1]!
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: TWO_FIELDS_MISSING_ERROR(fieldOne, fieldTwo),
          path: [fieldOne],
        })
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED, path: [fieldTwo] })
      } else if (val.year && val.year.length >= 4) {
        const isValid = dayjs(
          `${val.year}-${val.month?.padStart(2, '0')}-${val.day?.padStart(2, '0')}`,
          'YYYY-MM-DD',
          true,
        ).isValid()
        if (!isValid) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: REAL_DATE_ERROR, path: ['day'] })
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED, path: ['month'] })
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: BLANK_MESSAGE_SO_FIELD_HIGHLIGHTED, path: ['year'] })
        }
      }
      if (val.year && val.year.length < 4) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: YEAR_ERROR, path: ['year'] })
      }
    }
  })
  .transform(val => {
    const { day, month, year } = val
    return !day && !month && !year
      ? {}
      : {
          day: Number(day),
          month: Number(month),
          year: Number(year),
        }
  })

export type ReleaseDateForm = z.infer<typeof releaseDateSchema>
