import { z } from 'zod'
import { createSchema } from '../../../middleware/validationMiddleware'

const REASON_REQUIRED_MESSAGE = 'You must select a reason for the override'
const FURTHER_DETAIL_REQUIRED_MESSAGE = 'Enter the reason this calculation is incorrect'
const FURTHER_DETAIL_LENGTH_MESSAGE = 'The reason this calculation is incorrect must be 120 characters or less'
const INVALID_REASON = 'Enter a valid reason. Your explanation will help with future calculations.'

export const selectGenuineOverrideReasonSchemaFactory = createSchema({
  reason: z.string({ message: REASON_REQUIRED_MESSAGE }).trim(),
  reasonFurtherDetail: z.string().trim().max(120, { message: FURTHER_DETAIL_LENGTH_MESSAGE }).optional(),
})
  .superRefine((val, ctx) => {
    if (val.reason === 'OTHER' && !val.reasonFurtherDetail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: FURTHER_DETAIL_REQUIRED_MESSAGE,
        path: ['reasonFurtherDetail'],
      })
    } else if (val.reason === 'OTHER' && val.reasonFurtherDetail && !isValidReason(val.reasonFurtherDetail)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: INVALID_REASON,
        path: ['reasonFurtherDetail'],
      })
    }
  })
  .transform(val => {
    if (val.reason === 'OTHER') {
      return {
        reason: val.reason,
        reasonFurtherDetail: val.reasonFurtherDetail,
      }
    }
    return {
      reason: val.reason,
    }
  })

export type SelectGenuineOverrideReasonForm = z.infer<typeof selectGenuineOverrideReasonSchemaFactory>

const IgnoreListTokens = ['na', 'n a', 'other', 'no', 'nothing', 'none', 'nil', 'unknown']

const IgnoreListRegex = new RegExp(
  `\\b(${IgnoreListTokens.map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'gi',
)

export function isValidReason(input: string | null): boolean {
  // 1. Reject null or undefined values immediately
  if (!input) return false

  // 2. Remove leading/trailing spaces
  const trimmed = input.trim()

  // 3. Reject if nothing is left (e.g., user entered only spaces)
  if (trimmed.length === 0) return false

  // 4. Create a sanitized version of the input for validation purposes
  const sanitised = trimmed
    // Remove punctuation and symbols, but keep letters, numbers, and spaces
    .replace(/[^A-Za-z0-9 ]/g, '')

    // Remove filler words defined in the IgnoreListTokens
    .replace(IgnoreListRegex, '')

    // Remove all spaces so we can measure "real" content
    .replace(/\s+/g, '')

  // 5. Final check: ensure there is enough meaningful content left
  return sanitised.length >= 2
}
