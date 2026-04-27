import { Request, Response, NextFunction } from 'express'
import config from '../config'

const maintenanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (config.maintenanceMode) {
    return res.status(503).render('maintenance')
  }
  return next()
}

export default maintenanceMiddleware
