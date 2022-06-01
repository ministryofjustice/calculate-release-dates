import { resetStubs } from '../mockApis/wiremock'

import auth from '../mockApis/auth'
import tokenVerification from '../mockApis/tokenVerification'
import prisonApi from '../mockApis/prisonApi'
import prisonerSearchApi from '../mockApis/prisonerSearchApi'
import calculateReleaseDatesApi from '../mockApis/calculateReleaseDatesApi'

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
    stubGetUserCaseloads: prisonApi.stubGetUserCaseloads,

    stubPrisonerSearch: prisonerSearchApi.stubPrisonerSearch,

    stubConfirmCalculation: calculateReleaseDatesApi.stubConfirmCalculation,
    stubCalculatePreliminaryReleaseDates: calculateReleaseDatesApi.stubCalculatePreliminaryReleaseDates,
    stubGetCalculationResults: calculateReleaseDatesApi.stubGetCalculationResults,
    stubGetCalculationBreakdown: calculateReleaseDatesApi.stubGetCalculationBreakdown,
    stubGetNextWorkingDay: calculateReleaseDatesApi.stubGetNextWorkingDay,
    stubGetPreviousWorkingDay: calculateReleaseDatesApi.stubGetPreviousWorkingDay,
    stubValidate: calculateReleaseDatesApi.stubValidate,
    stubConfirmCalculation_errorNomisDataChanged: calculateReleaseDatesApi.stubConfirmCalculation_errorNomisDataChanged,
    stubConfirmCalculation_errorServerError: calculateReleaseDatesApi.stubConfirmCalculation_errorServerError,
    stubAdjustments: calculateReleaseDatesApi.stubAdjustments,
    stubSentencesAndOffences: calculateReleaseDatesApi.stubSentencesAndOffences,
    stubPrisonerDetails: calculateReleaseDatesApi.stubPrisonerDetails,
    stubLatestCalculation: calculateReleaseDatesApi.stubLatestCalculation,
    stubCalculationQuestions: calculateReleaseDatesApi.stubCalculationQuestions,
    stubCalculationUserInputs: calculateReleaseDatesApi.stubCalculationUserInputs,
  })
}
