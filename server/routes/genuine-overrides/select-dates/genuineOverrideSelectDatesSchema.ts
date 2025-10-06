import { z } from 'zod'
import { arrayOrUndefined, createSchema } from '../../../middleware/validationMiddleware'

const AT_LEAST_ONE_DATE_REQUIRED = 'You must select at least one date'

export const genuineOverrideSelectDatesSchema = createSchema({
  dateType: z.preprocess(
    arrayOrUndefined,
    z.array(z.string(), { message: AT_LEAST_ONE_DATE_REQUIRED }).min(1, { message: AT_LEAST_ONE_DATE_REQUIRED }),
  ),
})

export type GenuineOverrideSelectDatesForm = z.infer<typeof genuineOverrideSelectDatesSchema>
