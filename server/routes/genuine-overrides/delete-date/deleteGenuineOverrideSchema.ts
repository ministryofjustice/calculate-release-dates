import { z } from 'zod'
import { createSchema } from '../../../middleware/validationMiddleware'

const CONFIRM_REQUIRED_MESSAGE = 'You must select either yes or no.'

export const deleteGenuineOverrideDateSchema = createSchema({
  confirmDeleteDate: z.enum(['YES', 'NO'], { message: CONFIRM_REQUIRED_MESSAGE }),
})

export type DeleteGenuineOverrideDateForm = z.infer<typeof deleteGenuineOverrideDateSchema>
