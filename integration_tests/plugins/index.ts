import { resetStubs } from '../mockApis/wiremock'

import auth from '../mockApis/auth'
import tokenVerification from '../mockApis/tokenVerification'
import prisonApi from '../mockApis/prisonApi'

export default (on: (string, Record) => void): void => {
  on('task', {
    reset: resetStubs,

    getSignInUrl: auth.getSignInUrl,
    stubSignIn: auth.stubSignIn,

    stubAuthUser: auth.stubUser,
    stubAuthPing: auth.stubPing,

    stubTokenVerificationPing: tokenVerification.stubPing,

    stubGetPrisonerDetails: prisonApi.stubGetPrisonerDetails,
    stubGetSentencesAndOffences: prisonApi.stubGetSentencesAndOffences,
    stubGetSentenceAdjustments: prisonApi.stubGetSentenceAdjustments,
  })
}
