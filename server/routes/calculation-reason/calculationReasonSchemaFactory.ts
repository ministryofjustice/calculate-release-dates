import { z } from 'zod'
import { createSchema } from '../../middleware/validationMiddleware'

const REASON_REQUIRED_MESSAGE = 'You must select a reason for this calculation'
const FURTHER_DETAIL_REQUIRED_MESSAGE = 'Enter the reason for this calculation'
const FURTHER_DETAIL_LENGTH_MESSAGE = 'The reason for this calculation must be 120 characters or less'

export const calculationReasonSchemaFactory = createSchema({
  calculationReasonId: z.string({ message: REASON_REQUIRED_MESSAGE }),
  otherReasonDescription: z.string().trim().max(120, { message: FURTHER_DETAIL_LENGTH_MESSAGE }).optional(),
  otherReasonId: z.string(),
})
  .superRefine((val, ctx) => {
    if (val.calculationReasonId === val.otherReasonId && !val.otherReasonDescription) {
      ctx.addIssue({
        code: 'custom',
        message: FURTHER_DETAIL_REQUIRED_MESSAGE,
        path: ['otherReasonDescription'],
      })
    }
  })
  .transform(val => {
    if (val.calculationReasonId === val.otherReasonId) {
      return {
        calculationReasonId: Number(val.calculationReasonId),
        otherReasonDescription: val.otherReasonDescription,
      }
    }
    return {
      calculationReasonId: Number(val.calculationReasonId),
    }
  })

export type CalculationReasonForm = z.infer<typeof calculationReasonSchemaFactory>
