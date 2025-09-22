import type { Request, Response, NextFunction, RequestHandler } from 'express'

interface ParsedQs {
  [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[]
}

export default function asyncMiddleware<P extends { [key: string]: string }, ResBody, ReqBody, Qs extends ParsedQs>(
  fn: RequestHandler<P, ResBody, ReqBody, Qs>,
) {
  return (req: Request<P, ResBody, ReqBody, Qs>, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
