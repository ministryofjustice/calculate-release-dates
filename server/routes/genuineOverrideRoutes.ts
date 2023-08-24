import { RequestHandler } from 'express'
import UserPermissionsService from '../services/userPermissionsService'
import EntryPointService from '../services/entryPointService'
import PrisonerService from '../services/prisonerService'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import { FullPageError } from '../types/FullPageError'
import CheckInformationService from '../services/checkInformationService'

export default class GenuineOverrideRoutes {
  constructor(
    private readonly userPermissionsService: UserPermissionsService,
    private readonly entryPointService: EntryPointService,
    private readonly prisonerService: PrisonerService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly checkInformationService: CheckInformationService
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
      return res.redirect(`/specialist-support/calculation/${calculationReference}/calculation`)
    }
    throw FullPageError.notFoundError()
  }

  public loadCalculationPage: RequestHandler = async (req, res): Promise<void> => {
    if (this.userPermissionsService.allowSpecialSupport(res.locals.user.userRoles)) {
      return res.render('pages/genuineOverrides/calculationSummary')
    }
    throw FullPageError.notFoundError()
  }
}
