import { z } from 'zod'
import { createSchema } from '../../middleware/validationMiddleware'

const AGREEMENT_REQUIRED_MESSAGE = 'You must select either yes or no.'

export const calculationSummarySchema = createSchema({
  agreeWithDates: z.enum(['YES', 'NO'], { message: AGREEMENT_REQUIRED_MESSAGE }),
})

export type CalculationSummaryForm = z.infer<typeof calculationSummarySchema>
