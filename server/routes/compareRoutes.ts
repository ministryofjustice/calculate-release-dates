import { RequestHandler } from 'express'
import { stringify } from 'csv-stringify'
import logger from '../../logger'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import OneThousandCalculationsService from '../services/oneThousandCalculationsService'
import UserPermissionsService from '../services/userPermissionsService'
import PrisonerService from '../services/prisonerService'
import ComparisonService from '../services/comparisonService'

export const comparePaths = {
  COMPARE_INDEX: '/compare',
  COMPARE_MANUAL: '/compare/manual',
  COMPARE_CHOOSE: '/compare/choose',
  COMPARE_RUN: '/compare/run',
  COMPARE_MANUAL_LIST: '/compare/manual/list',
  COMPARE_LIST: '/compare/list',
  COMPARE_RESULT: '/compare/result/:bulkComparisonResultId',
  COMPARE_DETAIL: '/compare/result/:bulkComparisonResultId/detail/:bulkComparisonDetailId',
}

export default class CompareRoutes {
  constructor(
    private readonly oneThousandCalculationsService: OneThousandCalculationsService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly bulkLoadService: UserPermissionsService,
    private readonly prisonerService: PrisonerService,
    private readonly comparisonService: ComparisonService
  ) {
    // intentionally left blank
  }

  /* eslint-disable */
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
    return
  }

  public list: RequestHandler = async (req, res) => {
    const allowBulkComparison = this.bulkLoadService.allowBulkComparison(res.locals.user.userRoles)
    const usersCaseload = await this.prisonerService.getUsersCaseloads(res.locals.user.username, res.locals.user.token)
    const caseloadRadios = usersCaseload.map(caseload => ({ text: caseload.description, value: caseload.caseLoadId }))
    res.render('pages/compare/list', {
      allowBulkComparison,
      caseloadRadios,
    })
    return
  }

  public manual_list: RequestHandler = async (req, res) => {
    const allowBulkComparison = this.bulkLoadService.allowBulkComparison(res.locals.user.userRoles)
    const usersCaseload = await this.prisonerService.getUsersCaseloads(res.locals.user.username, res.locals.user.token)
    const caseloadRadios = usersCaseload.map(caseload => ({ text: caseload.description, value: caseload.caseLoadId }))
    res.render('pages/compare/manualList', {
      allowBulkComparison,
      caseloadRadios,
    })
    return
  }

  public result: RequestHandler = async (req, res) => {
    const { bulkComparisonResultId } = req.params
    const { token } = res.locals.user
    const comparison = await this.comparisonService.getPrisonComparison(bulkComparisonResultId, token)

    // retrieve the information about the bulkComparison
    const bulkComparison = {
      result: {
        id: req.params.bulkComparisonResultId,
        name: '1 Jan 2023',
      },
    }

    const allowBulkComparison = this.bulkLoadService.allowBulkComparison(res.locals.user.userRoles)

    res.render('pages/compare/resultOverview', {
      allowBulkComparison,
      comparison,
      bulkComparisonResultId,
    })
    return
  }
  public run: RequestHandler = async (req, res) => {
    const { selectedOMU } = req.body
    const { token } = res.locals.user
    const comparison = await this.comparisonService.createPrisonComparison(selectedOMU, token)
    return res.redirect(`/compare/result/${comparison.comparisonShortReference}`)
  }

  public detail: RequestHandler = async (req, res) => {
    const bulkComparison = {
      result: {
        id: req.params.bulkComparisonDetailId,
        name: '1 Jan 2023',
      },
      detail: {
        id: req.params.bulkComparisonResultId,
        person: 'A8031DY',
        booking: '1232122',
        latestDates: true,
        currentCalculation: {
          source: 'NOMIS',
          date: '13 March 2023',
        },
        dates: [
          [{ text: 'CRD' }, { text: '06/05/2022' }, { text: '06/05/2022' }, { text: '06/05/2022' }],
          [{ text: 'SLED' }, { text: '06/05/2022' }, { text: '06/05/2022' }, { text: '06/05/2022' }],
          [{ text: 'HDCED' }, { text: '06/05/2022' }, { text: '06/05/2022' }, { text: '06/05/2022' }],
        ],
      },
    }

    // retrieve the information about the bulkComparison
    const allowBulkComparison = this.bulkLoadService.allowBulkComparison(res.locals.user.userRoles)

    res.render('pages/compare/resultDetail', {
      allowBulkComparison,
      bulkComparison,
    })
    return
  }

  /* eslint-disable */
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
    return
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
