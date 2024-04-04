import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import { PrisonerSearchCriteria } from '../@types/prisonerOffenderSearch/prisonerSearchClientTypes'
import config from '../config'

export default class SearchRoutes {
  constructor(private readonly prisonerService: PrisonerService) {
    // intentionally left blank
  }

  public searchViewPrisoners: RequestHandler = this.searchPrisoners({
    settings: { view: true, ccard: false },
  })

  public searchCalculatePrisoners: RequestHandler = this.searchPrisoners({
    settings: {
      view: false,
      ccard: config.featureToggles.useCCARDLayout,
    },
  })

  private searchPrisoners({ settings }: { settings: { view: boolean; ccard: boolean } }): RequestHandler {
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
              prisonerIdentifier: prisonerIdentifier?.toUpperCase() || null,
              prisonIds: caseloads,
              includeAliases: false,
            } as PrisonerSearchCriteria)
          : []

      return res.render('pages/search/searchPrisoners', { ...settings, prisoners, searchValues })
    }
    return handler
  }
}
