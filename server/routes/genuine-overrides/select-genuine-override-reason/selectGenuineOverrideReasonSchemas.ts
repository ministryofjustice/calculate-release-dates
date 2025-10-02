import { z } from 'zod'
import { createSchema } from '../../../middleware/validationMiddleware'

const REASON_REQUIRED_MESSAGE = 'You must select a reason for the override'
const FURTHER_DETAIL_REQUIRED_MESSAGE = 'Enter the reason this calculation is incorrect'
const FURTHER_DETAIL_LENGTH_MESSAGE = 'The reason this calculation is incorrect must be 120 characters or less'

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
