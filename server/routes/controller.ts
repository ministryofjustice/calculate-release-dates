import { NextFunction, Request, Response } from 'express'

export interface Controller {
  GET(req: Request, res: Response, next?: NextFunction): Promise<void>
  POST?(req: Request, res: Response, next?: NextFunction): Promise<void>
}
