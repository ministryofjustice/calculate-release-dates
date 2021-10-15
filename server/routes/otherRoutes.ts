import { RequestHandler } from 'express'
import path from 'path'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import { PrisonerSearchCriteria } from '../@types/prisonerOffenderSearch/prisonerSearchClientTypes'
import logger from '../../logger'

export default class OtherRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService
  ) {}

  public listTestData: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const testData = await this.calculateReleaseDatesService.getTestData(username)
    res.render('pages/test/testData', { testData })
  }

  public testCalculation: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { bookingData } = req.query
    try {
      const releaseDates = bookingData
        ? await this.calculateReleaseDatesService.calculateReleaseDates(username, bookingData)
        : ''

      res.render('pages/test-pages/testCalculation', {
        releaseDates: releaseDates ? JSON.stringify(releaseDates, undefined, 4) : '',
        bookingData,
      })
    } catch (ex) {
      logger.error(ex)
      const errorSummaryList =
        ex.status > 499 && ex.status < 600
          ? [
              {
                text: `There was an error in the calculation API service: ${ex.data.userMessage}`,
                href: '#bookingData',
              },
            ]
          : [
              {
                text: 'The JSON is malformed',
                href: '#bookingData',
              },
            ]
      res.render('pages/test-pages/testCalculation', {
        bookingData,
        errorSummaryList,
      })
    }
  }

  public getPrisonerImage: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params
    this.prisonerService
      .getPrisonerImage(username, nomsId)
      .then(data => {
        res.type('image/jpeg')
        data.pipe(res)
      })
      .catch(() => {
        const placeHolder = path.join(process.cwd(), '/assets/images/image-missing.png')
        res.sendFile(placeHolder)
      })
  }

  public searchPrisoners: RequestHandler = async (req, res): Promise<void> => {
    const { firstName, lastName, prisonerIdentifier } = req.query as Record<string, string>
    const { username } = res.locals.user
    const searchValues = { firstName, lastName, prisonerIdentifier }

    if (!(prisonerIdentifier || firstName || lastName)) {
      return res.render('pages/search/searchPrisoners')
    }
    const prisoners = await this.prisonerService.searchPrisoners(username, {
      firstName,
      lastName,
      prisonerIdentifier: prisonerIdentifier || null,
      // prisonIds: ['MDI'], TODO Pass in prisonId's that user has access to
      includeAliases: false,
    } as PrisonerSearchCriteria)

    return res.render('pages/prisoners', { prisoners, searchValues })
  }
}
