import { RequestHandler } from 'express'
import { stringify } from 'csv-stringify'
import logger from '../../logger'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import OneThousandCalculationsService from '../services/oneThousandCalculationsService'
import BulkLoadService from '../services/bulkLoadService'
import PrisonerService from '../services/prisonerService'

export const comparePaths = {
  COMPARE_INDEX: '/compare',
  COMPARE_MANUAL: '/compare/manual',
  COMPARE_CHOOSE: '/compare/choose',
}

export default class CompareRoutes {
  constructor(
    private readonly oneThousandCalculationsService: OneThousandCalculationsService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly bulkLoadService: BulkLoadService,
    private readonly prisonerService: PrisonerService
  ) {}

  public index: RequestHandler = async (req, res) => {
    const allowBulkLoad = this.bulkLoadService.allowBulkLoad(res.locals.user.userRoles)
    const allowManualComparison = this.bulkLoadService.allowManualComparison(res.locals.user.userRoles)
    res.render('pages/compare/index', {
      allowBulkLoad,
      allowManualComparison,
    })
  }

  public choose: RequestHandler = async (req, res) => {
    const allowBulkComparison = this.bulkLoadService.allowBulkComparison(res.locals.user.userRoles)
    const usersCaseload = await this.prisonerService.getUsersCaseloads(res.locals.user.username, res.locals.user.token)
    const caseloadRadios = usersCaseload.map(caseload => ({ text: caseload.description, value: caseload.caseLoadId }))
    res.render('pages/compare/choosePrison', {
      allowBulkComparison,
      caseloadRadios,
    })
  }

  // eslint-disable-next-line consistent-return
  public submitManualCalculation: RequestHandler = async (req, res) => {
    const { username, caseloads, token } = res.locals.user
    const { prisonerIds } = req.body
    const nomsIds = prisonerIds.split(/\r?\n/)
    if (nomsIds.length > 500) return res.redirect(`/compare/manual`)

    const results = await this.oneThousandCalculationsService.runCalculations(username, caseloads, token, nomsIds)
    const fileName = `download-release-dates.csv`
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    stringify(results, {
      header: true,
    }).pipe(res)
  }

  public manualCalculation: RequestHandler = async (req, res): Promise<void> => {
    const { username, token } = res.locals.user
    const { bookingData } = req.query
    try {
      const releaseDates = bookingData
        ? await this.calculateReleaseDatesService.calculateReleaseDates(username, bookingData, token)
        : ''

      res.render('pages/compare/manual', {
        releaseDates: releaseDates ? JSON.stringify(releaseDates, undefined, 4) : '',
        bookingData,
      })
    } catch (ex) {
      logger.error(ex)
      const validationErrors =
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
        validationErrors,
      })
    }
  }
}
