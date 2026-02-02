import { z } from 'zod'
import { createSchema } from '../../middleware/validationMiddleware'

const REASON_REQUIRED_MESSAGE = 'You must select a reason for this calculation'
const DEFAULT_FURTHER_DETAIL_DESCRIPTION = 'the reason for this calculation'

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
      furtherDetailDescription: z.string().optional(),
    }),
  ),
})
  .superRefine((val, ctx) => {
    const reason = val.reasons.find(r => r.id === val.calculationReasonId)
    if (!reason) {
      throw Error('Selected reason details not found')
    }
    if (reason.requiresFurtherDetail) {
      const description = reason.furtherDetailDescription || DEFAULT_FURTHER_DETAIL_DESCRIPTION
      if (!reason.furtherDetail) {
        ctx.addIssue({
          code: 'custom',
          message: `Enter ${description}`,
          path: [`reasons_${reason.id}_furtherDetail`],
        })
      } else if (reason.furtherDetail.length > 120) {
        const message = `${description} must be 120 characters or less`
        ctx.addIssue({
          code: 'custom',
          message: message.charAt(0).toUpperCase() + message.slice(1),
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
