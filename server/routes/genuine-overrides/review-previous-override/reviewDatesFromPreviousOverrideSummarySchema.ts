import { z } from 'zod'
import { createSchema } from '../../../middleware/validationMiddleware'

const CONFIRMATION_REQUIRED_MESSAGE = 'You must select either yes or no.'

export const reviewDatesFromPreviousOverrideSummarySchema = createSchema({
  stillCorrect: z.enum(['YES', 'NO'], { message: CONFIRMATION_REQUIRED_MESSAGE }),
})

export type ReviewDatesFromPreviousOverrideSummaryForm = z.infer<typeof reviewDatesFromPreviousOverrideSummarySchema>
