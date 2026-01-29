import { z } from 'zod'
import { createSchema } from '../../middleware/validationMiddleware'

const REASON_REQUIRED_MESSAGE = 'You must select a reason for this calculation'
const FURTHER_DETAIL_REQUIRED_MESSAGE = 'Enter the reason for this calculation'
const FURTHER_DETAIL_LENGTH_MESSAGE = 'The reason for this calculation must be 120 characters or less'

export const calculationReasonSchemaFactory = createSchema({
  calculationReasonId: z.string({ message: REASON_REQUIRED_MESSAGE }),
  reasons: z.array(
    createSchema({
      requiresFurtherDetail: z
        .string()
        .optional()
        .transform(val => val === 'true'),
      id: z.string().optional(),
      furtherDetail: z.string().optional(),
    }),
  ),
})
  .superRefine((val, ctx) => {
    const reason = val.reasons.find(r => r.id === val.calculationReasonId)
    if (!reason) {
      throw Error('Selected reason details not found')
    }
    if (reason.requiresFurtherDetail) {
      if (!reason.furtherDetail) {
        ctx.addIssue({
          code: 'custom',
          message: FURTHER_DETAIL_REQUIRED_MESSAGE,
          path: [`reasons_${reason.id}_furtherDetail`],
        })
      } else if (reason.furtherDetail.length > 120) {
        ctx.addIssue({
          code: 'custom',
          message: FURTHER_DETAIL_LENGTH_MESSAGE,
          path: [`reasons_${reason.id}_furtherDetail`],
        })
      }
    }
  })
  .transform(val => {
    const reason = val.reasons.find(r => r.id === val.calculationReasonId)
    if (reason.requiresFurtherDetail) {
      return {
        calculationReasonId: Number(val.calculationReasonId),
        furtherDetail: reason.furtherDetail,
      }
    }
    return {
      calculationReasonId: Number(val.calculationReasonId),
    }
  })

export type CalculationReasonForm = z.infer<typeof calculationReasonSchemaFactory>
