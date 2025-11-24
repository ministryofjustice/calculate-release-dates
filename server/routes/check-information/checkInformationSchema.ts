import { z } from 'zod'
import { createSchema } from '../../middleware/validationMiddleware'

export const checkInformationSchema = createSchema({
  ersed: z
    .string()
    .optional()
    .transform(val => val === 'true'),
})

export type CheckInformationForm = z.infer<typeof checkInformationSchema>
