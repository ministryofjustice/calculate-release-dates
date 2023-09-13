import { RequestHandler } from 'express'
import UserPermissionsService from '../services/userPermissionsService'
import EntryPointService from '../services/entryPointService'
import PrisonerService from '../services/prisonerService'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import { FullPageError } from '../types/FullPageError'
import CheckInformationService from '../services/checkInformationService'
import UserInputService from '../services/userInputService'
import CalculationSummaryViewModel from '../models/CalculationSummaryViewModel'
import ViewReleaseDatesService from '../services/viewReleaseDatesService'
import logger from '../../logger'
import { ErrorMessages, ErrorMessageType } from '../types/ErrorMessages'
import { nunjucksEnv } from '../utils/nunjucksSetup'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import { GenuineOverride } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class GenuineOverrideRoutes {
  constructor(
    private readonly userPermissionsService: UserPermissionsService,
    private readonly entryPointService: EntryPointService,
    private readonly prisonerService: PrisonerService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly checkInformationService: CheckInformationService,
    private readonly userInputService: UserInputService,
    private readonly viewReleaseDatesService: ViewReleaseDatesService
  ) {
    // intentionally left blank
  }

  public startPage: RequestHandler = async (req, res): Promise<void> => {
    const { calculationReference } = req.query as Record<string, string>
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      if (calculationReference) {
        this.entryPointService.setEmailEntryPoint(res, calculationReference)
        const { username, token } = res.locals.user
        const calculation = await this.calculateReleaseDatesService.getCalculationResultsByReference(
          username,
          calculationReference,
          token
        )
        const prisonerDetail = await this.prisonerService.getPrisonerDetailForSpecialistSupport(
          username,
          calculation.prisonerId,
          token
        )
        return res.render('pages/genuineOverrides/index', { calculationReference, prisonerDetail })
      }
      this.entryPointService.setStandaloneEntrypointCookie(res)
      return res.render('pages/genuineOverrides/index', { calculationReference })
    }
    throw FullPageError.notFoundError()
  }

  public loadSearch: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      return res.render('pages/genuineOverrides/search')
    }
    throw FullPageError.notFoundError()
  }

  public submitSearch: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { calculationReference } = req.body
      if (!calculationReference) {
        const noCalculationReference = true
        return res.render('pages/genuineOverrides/search', { noCalculationReference })
      }
      const { username, token } = res.locals.user
      try {
        const calculation = await this.calculateReleaseDatesService.getCalculationResultsByReference(
          username,
          calculationReference,
          token
        )
        if (!calculation) {
          const calculationReferenceNotFound = true
          return res.render('pages/genuineOverrides/search', { calculationReferenceNotFound })
        }
        return res.redirect(`/specialist-support/calculation/${calculationReference}`)
      } catch (error) {
        const calculationReferenceNotFound = true
        return res.render('pages/genuineOverrides/search', { calculationReferenceNotFound })
      }
    }
    throw FullPageError.notFoundError()
  }

  public loadConfirmPage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { calculationReference } = req.params
      const { username, token } = res.locals.user
      try {
        const calculation = await this.calculateReleaseDatesService.getCalculationResultsByReference(
          username,
          calculationReference,
          token
        )
        const prisonerDetail = await this.prisonerService.getPrisonerDetailForSpecialistSupport(
          username,
          calculation.prisonerId,
          token
        )
        if (!calculation) {
          throw new Error()
        }
        if (!prisonerDetail) {
          throw new Error()
        }
        return res.render('pages/genuineOverrides/confirm', { calculation, prisonerDetail })
      } catch (error) {
        throw FullPageError.couldNotLoadConfirmPage()
      }
    }
    throw FullPageError.notFoundError()
  }

  public submitConfirmPage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { calculationReference } = req.params
      return res.redirect(`/specialist-support/calculation/${calculationReference}/sentence-and-offence-information`)
    }
    throw FullPageError.notFoundError()
  }

  public loadCheckSentenceAndInformationPage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const model = await this.checkInformationService.checkInformation(req, res, false)
      return res.render('pages/genuineOverrides/checkInformation', {
        model,
      })
    }
    throw FullPageError.notFoundError()
  }

  public submitCheckSentenceAndInformationPage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { calculationReference } = req.params
      const { username, token } = res.locals.user
      const calculation = await this.calculateReleaseDatesService.getCalculationResultsByReference(
        username,
        calculationReference,
        token
      )
      const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, calculation.prisonerId)
      userInputs.calculateErsed = req.body.ersed === 'true'
      this.userInputService.setCalculationUserInputForPrisoner(req, calculation.prisonerId, userInputs)

      const errors = await this.calculateReleaseDatesService.validateBackend(calculation.prisonerId, userInputs, token)
      if (errors.messages.length > 0) {
        return res.redirect(`/calculation/${calculation.prisonerId}/check-information?hasErrors=true`)
      }

      const releaseDates = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(
        username,
        calculation.prisonerId,
        userInputs,
        token
      )
      return res.redirect(
        `/specialist-support/calculation/${calculationReference}/summary/${releaseDates.calculationRequestId}`
      )
    }
    throw FullPageError.notFoundError()
  }

  public loadCalculationPage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { username, caseloads, token } = res.locals.user
      const calculationRequestId = Number(req.params.calculationRequestId)
      const { calculationReference } = req.params
      const { formError } = req.query
      const releaseDates = await this.calculateReleaseDatesService.getCalculationResults(
        username,
        calculationRequestId,
        token
      )
      const calculation = await this.calculateReleaseDatesService.getCalculationResultsByReference(
        username,
        calculationReference,
        token
      )
      if (releaseDates.prisonerId !== calculation.prisonerId) {
        throw FullPageError.notFoundError()
      }
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(
        username,
        releaseDates.prisonerId,
        caseloads,
        token
      )
      const weekendAdjustments = await this.calculateReleaseDatesService.getWeekendAdjustments(
        username,
        releaseDates,
        token
      )
      const serverErrors = req.flash('serverErrors')
      let validationErrors = null
      if (serverErrors && serverErrors[0]) {
        validationErrors = JSON.parse(serverErrors[0])
      }
      const breakdown = await this.calculateReleaseDatesService.getBreakdown(calculationRequestId, token)
      const sentencesAndOffences = await this.viewReleaseDatesService.getSentencesAndOffences(
        calculationRequestId,
        token
      )
      const model = new CalculationSummaryViewModel(
        releaseDates.dates,
        weekendAdjustments,
        calculationRequestId,
        calculation.prisonerId,
        prisonerDetail,
        sentencesAndOffences,
        false,
        false,
        breakdown?.calculationBreakdown,
        breakdown?.releaseDatesWithAdjustments,
        validationErrors,
        false,
        false
      )

      return res.render('pages/genuineOverrides/calculationSummary', { model, formError })
    }
    throw FullPageError.notFoundError()
  }

  public submitCalculationPage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { doYouAgree } = req.body
      const { calculationReference, calculationRequestId } = req.params
      if (!doYouAgree) {
        return res.redirect(
          `/specialist-support/calculation/${calculationReference}/summary/${calculationRequestId}?formError=true`
        )
      }
      if (doYouAgree === 'yes') {
        const { username, token } = res.locals.user
        const { nomsId } = req.params
        const calculationRequestIdNumber = Number(req.params.calculationRequestId)
        const breakdownHtml = await this.getBreakdownFragment(calculationRequestIdNumber, token)
        const approvedDates =
          req.session.selectedApprovedDates != null && req.session.selectedApprovedDates[nomsId] != null
            ? req.session.selectedApprovedDates[nomsId]
            : []
        try {
          const bookingCalculation = await this.calculateReleaseDatesService.confirmCalculation(
            username,
            calculationRequestIdNumber,
            token,
            {
              calculationFragments: {
                breakdownHtml,
              },
              approvedDates,
            }
          )
          // This uses the new calculation reference, so it can be used in the email for the OMU staff for a link to the view journey
          return res.redirect(
            `/specialist-support/calculation/${bookingCalculation.calculationReference}/complete/${bookingCalculation.calculationRequestId}`
          )
        } catch (error) {
          // TODO Move handling of validation errors from the api into the service layer
          logger.error(error)
          if (error.status === 412) {
            req.flash(
              'serverErrors',
              JSON.stringify({
                messages: [
                  {
                    text: 'The booking data that was used for this calculation has changed, go back to the Check NOMIS Information screen to see the changes',
                    href: `/specialist-support/calculation/${calculationReference}/sentence-and-offence-information'`,
                  },
                ],
              } as ErrorMessages)
            )
          } else {
            req.flash(
              'serverErrors',
              JSON.stringify({
                messages: [{ text: 'The calculation could not be saved in NOMIS.' }],
                messageType: ErrorMessageType.SAVE_DATES,
              } as ErrorMessages)
            )
          }
          return res.redirect(`/specialist-support/calculation/${calculationReference}/summary/${calculationRequestId}`)
        }
      }
      if (doYouAgree === 'no') {
        return res.redirect(`/specialist-support/calculation/${calculationReference}/reason`)
      }
    }
    throw FullPageError.notFoundError()
  }

  public loadConfirmationPage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { calculationRequestId } = req.params
      const { username, caseloads, token } = res.locals.user
      const releaseDates = await this.calculateReleaseDatesService.getCalculationResults(
        username,
        Number(calculationRequestId),
        token
      )
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(
        username,
        releaseDates.prisonerId,
        caseloads,
        token
      )
      return res.render('pages/genuineOverrides/confirmation', { prisonerDetail })
    }
    throw FullPageError.notFoundError()
  }

  public loadReasonPage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { calculationReference } = req.params
      const { username, caseloads, token } = res.locals.user
      const { noRadio, noOtherReason } = req.query
      const releaseDates = await this.calculateReleaseDatesService.getCalculationResultsByReference(
        username,
        calculationReference,
        token
      )
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(
        username,
        releaseDates.prisonerId,
        caseloads,
        token
      )
      return res.render('pages/genuineOverrides/reason', { prisonerDetail, noRadio, noOtherReason })
    }
    throw FullPageError.notFoundError()
  }

  public submitReasonPage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { calculationReference } = req.params
      const { token } = res.locals.user
      const { overrideReason, otherReason } = req.body
      if (!overrideReason) {
        return res.redirect(`/specialist-support/calculation/${calculationReference}/reason?noRadio=true`)
      }
      if (overrideReason === 'other' && otherReason === '') {
        return res.redirect(`/specialist-support/calculation/${calculationReference}/reason?noOtherReason=true`)
      }
      const reason = overrideReason === 'other' && otherReason ? `Other: ${otherReason}` : overrideReason
      const genuineOverride = {
        reason,
        originalCalculationRequest: calculationReference,
        isOverridden: true,
      } as GenuineOverride
      await new CalculateReleaseDatesApiClient(token).storeOverrideReason(genuineOverride)
      return res.redirect(`/specialist-support/calculation/${calculationReference}/select-date-types`)
    }
    throw FullPageError.notFoundError()
  }

  public loadSelectDatesPage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { calculationReference } = req.params
      const { username, caseloads, token } = res.locals.user
      const releaseDates = await this.calculateReleaseDatesService.getCalculationResultsByReference(
        username,
        calculationReference,
        token
      )
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(
        username,
        releaseDates.prisonerId,
        caseloads,
        token
      )
      const config = {}
      return res.render('pages/genuineOverrides/dateTypeSelection', { prisonerDetail, config })
    }
    throw FullPageError.notFoundError()
  }

  private async getBreakdownFragment(calculationRequestId: number, token: string): Promise<string> {
    return nunjucksEnv().render('pages/fragments/breakdownFragment.njk', {
      model: {
        ...(await this.calculateReleaseDatesService.getBreakdown(calculationRequestId, token)),
        showBreakdown: () => true,
      },
    })
  }
}
