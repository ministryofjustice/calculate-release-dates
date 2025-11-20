import { z } from 'zod'
import { createSchema } from '../../middleware/validationMiddleware'

const YES_OR_NO_REQUIRED_MESSAGE = 'You must select either yes or no.'

export const previouslyRecordedSledSchema = createSchema({
  usePreviouslyRecordedSLED: z.enum(['YES', 'NO'], { message: YES_OR_NO_REQUIRED_MESSAGE }),
})

export type PreviouslyRecordedSledForm = z.infer<typeof previouslyRecordedSledSchema>
