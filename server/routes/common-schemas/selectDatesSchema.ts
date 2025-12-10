import { z } from 'zod'
import { safeArray, createSchema } from '../../middleware/validationMiddleware'

export const selectDatesSchema = createSchema({
  dateType: z.preprocess(safeArray, z.array(z.string())),
})

export type SelectDatesForm = z.infer<typeof selectDatesSchema>
