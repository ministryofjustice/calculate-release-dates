import { Request, Response, NextFunction } from 'express'

const maintenanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  return res.status(503).render('maintenance')
}

export default maintenanceMiddleware
