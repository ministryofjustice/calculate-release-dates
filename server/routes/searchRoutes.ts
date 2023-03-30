import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import { PrisonerSearchCriteria } from '../@types/prisonerOffenderSearch/prisonerSearchClientTypes'

export default class SearchRoutes {
  constructor(private readonly prisonerService: PrisonerService) {}

  public searchViewPrisoners: RequestHandler = this.searchPrisoners({ view: true })

  public searchCalculatePrisoners: RequestHandler = this.searchPrisoners({ view: false })

  private searchPrisoners(settings: { view: boolean }): RequestHandler {
    const handler: RequestHandler = async (req, res): Promise<void> => {
      const { firstName, lastName, prisonerIdentifier } = req.query as Record<string, string>
      const { username, caseloads } = res.locals.user
      const searchValues = { firstName, lastName, prisonerIdentifier }

      if (!(prisonerIdentifier || firstName || lastName)) {
        return res.render('pages/search/searchPrisoners', settings)
      }
      const prisoners =
        caseloads.length > 0
          ? await this.prisonerService.searchPrisoners(username, {
              firstName,
              lastName,
              prisonerIdentifier: prisonerIdentifier?.toUpperCase(),
              prisonIds: caseloads,
              includeAliases: false,
            } as PrisonerSearchCriteria)
          : []

      return res.render('pages/search/searchPrisoners', { ...settings, prisoners, searchValues })
    }
    return handler
  }
}
