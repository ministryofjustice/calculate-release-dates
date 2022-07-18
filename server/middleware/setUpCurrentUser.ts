import { Router } from 'express'
import auth from '../authentication/auth'
import populateCurrentUser from './populateCurrentUser'
import type { Services } from '../services'
import tokenVerifier from '../data/tokenVerification'

export default function setUpCurrentUser({ userService }: Services): Router {
  const router = Router({ mergeParams: true })
  router.use(auth.authenticationMiddleware(tokenVerifier))
  router.use(populateCurrentUser(userService))
  return router
}
