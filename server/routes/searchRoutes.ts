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

      if (this.isSearchCriteriaEmpty(searchValues)) {
        return res.render('pages/search/searchPrisoners', {})
      }

      this.addInactiveBookingCaseloads(caseloads)

      const prisoners = await this.getPrisoners(searchValues, username, caseloads)

      return res.render('pages/search/searchPrisoners', { prisoners, searchValues })
    }
  }

  private isSearchCriteriaEmpty(searchValues: {
    firstName: string
    lastName: string
    prisonerIdentifier: string | null
  }) {
    const { firstName, lastName, prisonerIdentifier } = searchValues
    return !prisonerIdentifier && !firstName && !lastName
  }

  private addInactiveBookingCaseloads(caseloads: string[]): void {
    if (authorisedRoles.ROLE_INACTIVE_BOOKINGS) {
      caseloads.push('OUT', 'TRN')
    }
  }

  private async getPrisoners(
    searchValues: { firstName: string; lastName: string; prisonerIdentifier: string | null },
    username: string,
    caseloads: string[],
  ) {
    if (caseloads.length === 0) return []

    const searchCriteria: PrisonerSearchCriteria = {
      ...searchValues,
      prisonIds: caseloads,
      includeAliases: false,
      includeRestrictivePatients: true,
    }

    return this.prisonerService.searchPrisoners(username, searchCriteria)
  }
}
