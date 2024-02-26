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
import {
  CalculationRequestModel,
  GenuineOverrideRequest,
  ManualEntrySelectedDate,
  SubmittedDate,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import ManualEntryService from '../services/manualEntryService'
import ManualCalculationService from '../services/manualCalculationService'
import GenuineOverridesEmailTemplateService from '../services/genuineOverridesEmailTemplateService'
import GenuineOverridesCalculationSummaryPageViewModel from '../models/GenuineOverridesCalculationSummaryPageViewModel'
import CheckInformationViewModel from '../models/CheckInformationViewModel'
import GenuineOverridesConfirmViewModel from '../models/GenuineOverridesConfirmViewModel'
import GenuineOverridesConfirmationViewModel from '../models/GenuineOverridesConfirmationViewModel'
import GenuineOverridesConfirmOverrideViewModel from '../models/GenuineOverridesConfirmOverrideViewModel'
import GenuineOverridesDateEntryViewModel from '../models/GenuineOverridesDateEntryViewModel'
import GenuineOverridesDateTypeSelectionViewModel from '../models/GenuineOverridesDateTypeSelectionViewModel'
import GenuineOverridesIndexViewModel from '../models/GenuineOverridesIndexViewModel'
import GenuineOverridesLoadReasonsViewModel from '../models/GenuineOverridesLoadReasonsViewModel'
import GenuineOverridesRemoveDateViewModel from '../models/GenuineOverridesRemoveDateViewModel'
import GenuineOverridesRequestSupportViewModel from '../models/GenuineOverridesRequestSupportViewModel'

export default class GenuineOverrideRoutes {
  constructor(
    private readonly userPermissionsService: UserPermissionsService,
    private readonly entryPointService: EntryPointService,
    private readonly prisonerService: PrisonerService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly checkInformationService: CheckInformationService,
    private readonly userInputService: UserInputService,
    private readonly viewReleaseDatesService: ViewReleaseDatesService,
    private readonly manualEntryService: ManualEntryService,
    private readonly manualCalculationService: ManualCalculationService,
    private readonly genuineOverridesEmailTemplateService: GenuineOverridesEmailTemplateService,
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
          token,
        )
        const prisonerDetail = await this.prisonerService.getPrisonerDetailForSpecialistSupport(
          username,
          calculation.prisonerId,
          token,
        )
        return res.render(
          'pages/genuineOverrides/index',
          new GenuineOverridesIndexViewModel(calculationReference, prisonerDetail),
        )
      }
      this.entryPointService.setStandaloneEntrypointCookie(res)
      return res.render('pages/genuineOverrides/index', new GenuineOverridesIndexViewModel(calculationReference))
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
          token,
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
          token,
          true,
        )
        const prisonerDetail = await this.prisonerService.getPrisonerDetailForSpecialistSupport(
          username,
          calculation.prisonerId,
          token,
        )
        if (!calculation) {
          throw new Error()
        }
        if (!prisonerDetail) {
          throw new Error()
        }
        return res.render(
          'pages/genuineOverrides/confirm',
          new GenuineOverridesConfirmViewModel(prisonerDetail, calculation),
        )
      } catch (error) {
        if (error && error.status === 409) {
          throw FullPageError.theDataHasChangedPage()
        }
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
      return res.render('pages/genuineOverrides/checkInformation', new CheckInformationViewModel(model))
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
        token,
      )
      const userInputs = this.userInputService.getCalculationUserInputForPrisoner(req, calculation.prisonerId)
      userInputs.calculateErsed = req.body.ersed === 'true'
      this.userInputService.setCalculationUserInputForPrisoner(req, calculation.prisonerId, userInputs)

      const errors = await this.calculateReleaseDatesService.validateBackend(calculation.prisonerId, userInputs, token)
      if (errors.messages.length > 0) {
        return res.redirect(`/calculation/${calculation.prisonerId}/check-information?hasErrors=true`)
      }
      if (!req.session.selectedManualEntryDates) {
        req.session.selectedManualEntryDates = {}
      }
      if (req.session.selectedManualEntryDates[calculation.prisonerId]) {
        req.session.selectedManualEntryDates[calculation.prisonerId] = []
      }

      const calculationRequestModel = {
        calculationUserInputs: userInputs,
        calculationReasonId: req.session.calculationReasonId[calculation.prisonerId],
        otherReasonDescription: req.session.otherReasonDescription[calculation.prisonerId],
      } as CalculationRequestModel

      const releaseDates = await this.calculateReleaseDatesService.calculatePreliminaryReleaseDates(
        username,
        calculation.prisonerId,
        calculationRequestModel,
        token,
      )
      return res.redirect(
        `/specialist-support/calculation/${calculationReference}/summary/${releaseDates.calculationRequestId}`,
      )
    }
    throw FullPageError.notFoundError()
  }

  public loadCalculationPage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { username, caseloads, token } = res.locals.user
      const calculationRequestId = Number(req.params.calculationRequestId)
      const { calculationReference } = req.params
      const formError = <string>req.query.formError === 'true'
      const releaseDates = await this.calculateReleaseDatesService.getCalculationResults(
        username,
        calculationRequestId,
        token,
      )
      const calculation = await this.calculateReleaseDatesService.getCalculationResultsByReference(
        username,
        calculationReference,
        token,
      )
      if (releaseDates.prisonerId !== calculation.prisonerId) {
        throw FullPageError.notFoundError()
      }
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(
        username,
        releaseDates.prisonerId,
        caseloads,
        token,
      )
      const weekendAdjustments = await this.calculateReleaseDatesService.getWeekendAdjustments(
        username,
        releaseDates,
        token,
      )
      const nonFridayReleaseAdjustments = await this.calculateReleaseDatesService.getNonFridayReleaseAdjustments(
        releaseDates,
        token,
      )
      const serverErrors = req.flash('serverErrors')
      let validationErrors = null
      if (serverErrors && serverErrors[0]) {
        validationErrors = JSON.parse(serverErrors[0])
      }
      const breakdown = await this.calculateReleaseDatesService.getBreakdown(calculationRequestId, token)
      const sentencesAndOffences = await this.viewReleaseDatesService.getSentencesAndOffences(
        calculationRequestId,
        token,
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
        releaseDates.calculationReference,
        nonFridayReleaseAdjustments,
        false,
        null,
        null,
        null,
        breakdown?.calculationBreakdown,
        breakdown?.releaseDatesWithAdjustments,
        validationErrors,
        false,
        false,
      )

      return res.render(
        'pages/genuineOverrides/calculationSummary',
        new GenuineOverridesCalculationSummaryPageViewModel(
          model.prisonerDetail,
          model,
          formError,
          calculationReference,
        ),
      )
    }
    throw FullPageError.notFoundError()
  }

  public submitCalculationPage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { doYouAgree } = req.body
      const { calculationReference, calculationRequestId } = req.params
      if (!doYouAgree) {
        return res.redirect(
          `/specialist-support/calculation/${calculationReference}/summary/${calculationRequestId}?formError=true`,
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
              isSpecialistSupport: true,
            },
          )
          const genuineOverride = {
            reason: '',
            originalCalculationRequest: calculationReference,
            savedCalculation: bookingCalculation.calculationReference,
            isOverridden: false,
          } as GenuineOverrideRequest
          await new CalculateReleaseDatesApiClient(token).storeOverrideReason(genuineOverride)
          // This uses the new calculation reference, so it can be used in the email for the OMU staff for a link to the view journey
          return res.redirect(`/specialist-support/calculation/${bookingCalculation.calculationReference}/complete`)
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
              } as ErrorMessages),
            )
          } else {
            req.flash(
              'serverErrors',
              JSON.stringify({
                messages: [{ text: 'The calculation could not be saved in NOMIS.' }],
                messageType: ErrorMessageType.SAVE_DATES,
              } as ErrorMessages),
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
      const { calculationReference } = req.params
      const { username, caseloads, token } = res.locals.user
      const releaseDates = await this.calculateReleaseDatesService.getCalculationResultsByReference(
        username,
        calculationReference,
        token,
      )
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(
        username,
        releaseDates.prisonerId,
        caseloads,
        token,
      )
      const override = await this.calculateReleaseDatesService.getGenuineOverride(calculationReference, token)
      const emailContent = override.isOverridden
        ? this.genuineOverridesEmailTemplateService.getIncorrectCalculationEmail(
            calculationReference,
            prisonerDetail,
            releaseDates.calculationRequestId,
          )
        : this.genuineOverridesEmailTemplateService.getCorrectCalculationEmail(
            calculationReference,
            prisonerDetail,
            releaseDates.calculationRequestId,
          )
      return res.render(
        'pages/genuineOverrides/confirmation',
        new GenuineOverridesConfirmationViewModel(prisonerDetail, emailContent),
      )
    }
    throw FullPageError.notFoundError()
  }

  public loadReasonPage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { calculationReference } = req.params
      const { username, caseloads, token } = res.locals.user
      const noRadio = <string>req.query.noRadio === 'true'
      const noOtherReason = <string>req.query.noOtherReason === 'true'
      const releaseDates = await this.calculateReleaseDatesService.getCalculationResultsByReference(
        username,
        calculationReference,
        token,
      )
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(
        username,
        releaseDates.prisonerId,
        caseloads,
        token,
      )
      return res.render(
        'pages/genuineOverrides/reason',
        new GenuineOverridesLoadReasonsViewModel(prisonerDetail, noRadio, noOtherReason, calculationReference),
      )
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
      const reason =
        overrideReason === 'other' && otherReason
          ? `Other: ${otherReason[0].toLowerCase() + otherReason.slice(1)}`
          : overrideReason
      const genuineOverride = {
        reason,
        originalCalculationRequest: calculationReference,
        isOverridden: true,
      } as GenuineOverrideRequest
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
        token,
      )
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(
        username,
        releaseDates.prisonerId,
        caseloads,
        token,
      )
      const { config } = this.manualEntryService.verifySelectedDateType(req, releaseDates.prisonerId, false, true)
      return res.render(
        'pages/genuineOverrides/dateTypeSelection',
        new GenuineOverridesDateTypeSelectionViewModel(prisonerDetail, config, calculationReference),
      )
    }
    throw FullPageError.notFoundError()
  }

  public submitSelectDatesPage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { calculationReference } = req.params
      const { username, caseloads, token } = res.locals.user

      if (!req.session.selectedManualEntryDates) {
        req.session.selectedManualEntryDates = {}
      }
      const releaseDates = await this.calculateReleaseDatesService.getCalculationResultsByReference(
        username,
        calculationReference,
        token,
      )
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(
        username,
        releaseDates.prisonerId,
        caseloads,
        token,
      )

      const { error, config } = this.manualEntryService.verifySelectedDateType(
        req,
        releaseDates.prisonerId,
        false,
        false,
      )
      if (error) {
        return res.render(
          'pages/genuineOverrides/dateTypeSelection',
          new GenuineOverridesDateTypeSelectionViewModel(prisonerDetail, config, calculationReference, true),
        )
      }
      this.manualEntryService.addManuallyCalculatedDateTypes(req, releaseDates.prisonerId)

      return res.redirect(`/specialist-support/calculation/${calculationReference}/enter-date`)
    }
    throw FullPageError.notFoundError()
  }

  public loadEnterDatePage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { calculationReference } = req.params
      const { username, caseloads, token } = res.locals.user
      const { year, month, day } = req.query
      const releaseDates = await this.calculateReleaseDatesService.getCalculationResultsByReference(
        username,
        calculationReference,
        token,
      )
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(
        username,
        releaseDates.prisonerId,
        caseloads,
        token,
      )
      if (req.session.selectedManualEntryDates[releaseDates.prisonerId].length === 0) {
        return res.redirect(`/specialist-support/calculation/${calculationReference}/select-date-types`)
      }
      let previousDate
      if (year && month && day) {
        previousDate = { year, month, day } as unknown as SubmittedDate
      }
      const date = this.manualEntryService.getNextDateToEnter(
        req.session.selectedManualEntryDates[releaseDates.prisonerId],
      )
      if (date && date.dateType !== 'None') {
        return res.render(
          'pages/genuineOverrides/dateEntry',
          new GenuineOverridesDateEntryViewModel(prisonerDetail, date, calculationReference, previousDate),
        )
      }
      return res.redirect(`/specialist-support/calculation/${calculationReference}/confirm-override`)
    }
    throw FullPageError.notFoundError()
  }

  public submitEnterDatePage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { username, caseloads, token } = res.locals.user
      const { calculationReference } = req.params
      const releaseDates = await this.calculateReleaseDatesService.getCalculationResultsByReference(
        username,
        calculationReference,
        token,
      )
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(
        username,
        releaseDates.prisonerId,
        caseloads,
        token,
      )

      const storeDateResponse = this.manualEntryService.storeDate(
        req.session.selectedManualEntryDates[releaseDates.prisonerId],
        req.body,
      )
      if (!storeDateResponse.success && storeDateResponse.message && !storeDateResponse.isNone) {
        const { date, message, enteredDate } = storeDateResponse
        return res.render(
          'pages/genuineOverrides/dateEntry',
          new GenuineOverridesDateEntryViewModel(
            prisonerDetail,
            date,
            calculationReference,
            undefined,
            enteredDate,
            message,
          ),
        )
      }
      if (storeDateResponse.success && !storeDateResponse.message) {
        req.session.selectedManualEntryDates[releaseDates.prisonerId].find(
          (d: ManualEntrySelectedDate) => d.dateType === storeDateResponse.date.dateType,
        ).date = storeDateResponse.date.date
        return res.redirect(`/specialist-support/calculation/${calculationReference}/enter-date`)
      }
      return res.redirect(`/specialist-support/calculation/${calculationReference}/confirm-override`)
    }
    throw FullPageError.notFoundError()
  }

  public loadConfirmOverridePage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { username, caseloads, token } = res.locals.user
      const { calculationReference } = req.params
      const releaseDates = await this.calculateReleaseDatesService.getCalculationResultsByReference(
        username,
        calculationReference,
        token,
      )
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(
        username,
        releaseDates.prisonerId,
        caseloads,
        token,
      )
      const rows = this.manualEntryService.getConfirmationConfiguration(req, releaseDates.prisonerId, true)

      return res.render(
        'pages/genuineOverrides/confirmOverride',
        new GenuineOverridesConfirmOverrideViewModel(prisonerDetail, rows, calculationReference),
      )
    }
    throw FullPageError.notFoundError()
  }

  public loadChangeDate: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { username, token } = res.locals.user
      const { calculationReference } = req.params
      const releaseDates = await this.calculateReleaseDatesService.getCalculationResultsByReference(
        username,
        calculationReference,
        token,
      )
      const { date } = this.manualEntryService.changeDate(req, releaseDates.prisonerId)
      return res.redirect(
        `/specialist-support/calculation/${calculationReference}/enter-date?year=${date.year}&month=${date.month}&day=${date.day}`,
      )
    }
    throw FullPageError.notFoundError()
  }

  public loadRemoveDate: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { username, caseloads, token } = res.locals.user
      const { calculationReference } = req.params
      const releaseDates = await this.calculateReleaseDatesService.getCalculationResultsByReference(
        username,
        calculationReference,
        token,
      )
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(
        username,
        releaseDates.prisonerId,
        caseloads,
        token,
      )
      const dateToRemove: string = <string>req.query.dateType
      if (
        req.session.selectedManualEntryDates[releaseDates.prisonerId].some(
          (d: ManualEntrySelectedDate) => d.dateType === dateToRemove,
        )
      ) {
        const fullDateName = this.manualEntryService.fullStringLookup(dateToRemove)
        return res.render(
          'pages/genuineOverrides/removeDate',
          new GenuineOverridesRemoveDateViewModel(prisonerDetail, dateToRemove, fullDateName, calculationReference),
        )
      }
      return res.redirect(`/specialist-support/calculation/${calculationReference}/confirm-override`)
    }
    throw FullPageError.notFoundError()
  }

  public submitRemoveDate: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { username, caseloads, token } = res.locals.user
      const { calculationReference } = req.params

      const dateToRemove: string = <string>req.query.dateType
      const releaseDates = await this.calculateReleaseDatesService.getCalculationResultsByReference(
        username,
        calculationReference,
        token,
      )
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(
        username,
        releaseDates.prisonerId,
        caseloads,
        token,
      )
      const fullDateName = this.manualEntryService.fullStringLookup(dateToRemove)
      if (req.body['remove-date'] !== 'yes' && req.body['remove-date'] !== 'no') {
        const error = true
        return res.render(
          'pages/genuineOverrides/removeDate',
          new GenuineOverridesRemoveDateViewModel(
            prisonerDetail,
            dateToRemove,
            fullDateName,
            calculationReference,
            error,
          ),
        )
      }
      const remainingDates = this.manualEntryService.removeDate(req, releaseDates.prisonerId)
      if (remainingDates === 0) {
        return res.redirect(`/specialist-support/calculation/${calculationReference}/select-date-types`)
      }
      return res.redirect(`/specialist-support/calculation/${calculationReference}/confirm-override`)
    }
    throw FullPageError.notFoundError()
  }

  public submitConfirmOverridePage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      const { username, token } = res.locals.user
      const { calculationReference } = req.params
      const releaseDates = await this.calculateReleaseDatesService.getCalculationResultsByReference(
        username,
        calculationReference,
        token,
      )
      const manualCalculationResponse = await this.manualCalculationService.storeGenuineOverrideCalculation(
        calculationReference,
        releaseDates.prisonerId,
        req,
        token,
      )
      return res.redirect(`/specialist-support/calculation/${manualCalculationResponse.calculationReference}/complete`)
    }
    throw FullPageError.notFoundError()
  }

  public loadGenuineOverrideRequestPage: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { calculationReference } = req.params

    const releaseDates = await this.calculateReleaseDatesService.getCalculationResultsByReference(
      username,
      calculationReference,
      token,
    )
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(
      username,
      releaseDates.prisonerId,
      caseloads,
      token,
    )
    const { calculationRequestId } = releaseDates
    return res.render(
      'pages/genuineOverrides/requestSupport',
      new GenuineOverridesRequestSupportViewModel(prisonerDetail, calculationReference, calculationRequestId),
    )
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
