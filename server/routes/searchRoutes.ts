import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import { PrisonerSearchCriteria } from '../@types/prisonerOffenderSearch/prisonerSearchClientTypes'
import authorisedRoles from '../enumerations/authorisedRoles'

export default class SearchRoutes {
  constructor(private readonly prisonerService: PrisonerService) {
    // intentionally left blank
  }

  public searchCalculatePrisoners: RequestHandler = this.searchPrisoners()

  private searchPrisoners(): RequestHandler {
    return async (req, res): Promise<void> => {
      const { firstName, lastName, prisonerIdentifier } = req.query as Record<string, string>
      const { username, caseloads } = res.locals.user
      const searchValues = { firstName, lastName, prisonerIdentifier }

      if (!(prisonerIdentifier || firstName || lastName)) {
        return res.render('pages/search/searchPrisoners', {})
      }

      if (authorisedRoles.ROLE_INACTIVE_BOOKINGS) {
        caseloads.push('OUT')
      }

      const prisoners =
        caseloads.length > 0
          ? await this.prisonerService.searchPrisoners(username, {
              firstName,
              lastName,
              prisonerIdentifier: prisonerIdentifier?.toUpperCase() || null,
              prisonIds: caseloads,
              includeAliases: false,
            } as PrisonerSearchCriteria)
          : []

      return res.render('pages/search/searchPrisoners', { prisoners, searchValues })
    }
  }
}
