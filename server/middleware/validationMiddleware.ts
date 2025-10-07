import { NextFunction, Request, Response } from 'express'
import { z, ZodError } from 'zod'

// Set a custom locale with no default error message for custom errors to prevent defaulting to "Invalid input"
z.config({
  localeError: issue => {
    if (issue.code === 'custom') {
      return ''
    }
    return z.locales.en().localeError(issue)
  },
})

export type fieldErrors = {
  [field: string | number | symbol]: string[] | undefined
}
export const buildErrorSummaryList = (array: fieldErrors) => {
  if (!array) return null
  return Object.entries(array)
    .filter(([_, errors]) => errors)
    .flatMap(([field, errors]) => {
      return errors!
        .filter(([_, error]) => error && error.length > 0)
        .map(error => ({
          text: error,
          href: `#${field}`,
        }))
    })
}

export const findError = (errors: fieldErrors, fieldName: string) => {
  if (!errors?.[fieldName]) {
    return null
  }
  return {
    text: errors[fieldName]?.[0],
  }
}

export type SchemaFactory<P extends { [key: string]: string }> = (request: Request<P>) => Promise<z.ZodTypeAny>

export const validate = <P extends { [key: string]: string }>(schema: z.ZodTypeAny | SchemaFactory<P>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    if (!schema) {
      return next()
    }
    const resolvedSchema = typeof schema === 'function' ? await schema(req) : schema
    const result = resolvedSchema.safeParse(req.body)
    if (result.success) {
      req.body = result.data
      return next()
    }
    req.flash('formResponses', JSON.stringify(req.body))
    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error)

    req.flash('validationErrors', JSON.stringify(deduplicatedFieldErrors))
    const urlWithDefaultFragmentSoAnyFieldFocusIsRemoved = `${req.originalUrl}#`
    return res.redirect(urlWithDefaultFragmentSoAnyFieldFocusIsRemoved)
  }
}

export const createSchema = <T = object>(shape: T) => zObjectStrict(shape)

const zObjectStrict = <T = object>(shape: T) => z.object({ _csrf: z.string().optional(), ...shape }).strict()

export const deduplicateFieldErrors = <Output>(errors: ZodError<Output>) => {
  return Object.fromEntries(
    Object.entries(z.flattenError(errors).fieldErrors).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...new Set(value)] : [],
    ]),
  )
}

export const arrayOrUndefined = (val: string | string[] | undefined): string[] | undefined => {
  if (val === undefined) {
    return undefined
  }
  if (Array.isArray(val)) {
    return val
  }
  return [val]
}
