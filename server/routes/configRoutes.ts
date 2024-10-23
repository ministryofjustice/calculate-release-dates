import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import ConfigurationViewModel from '../models/ConfigurationViewModel'
import readOnlyNomisScreens from '../models/ReadOnlyNomisScreens'
import ReadOnlyPrisonResult from '../types/ReadOnlyPrisonResult'
import { PrisonApiPrisonDetails } from '../@types/prisonApi/prisonClientTypes'
import UserPermissionsService from '../services/userPermissionsService'

export default class ConfigRoutes {
  constructor(
    // private readonly comparisonService: ComparisonService, //

    private readonly prisonerService: PrisonerService,
    private readonly userPermissionService: UserPermissionsService,
  ) {
    // intentionally left blank
  }

  public getConfig: RequestHandler = async (req, res) => {
    const { token, userRoles } = res.locals.user
    const activePrisons = await this.prisonerService.getActivePrisons(token)
    const readOnlyPrisonResults = await Promise.all(
      readOnlyNomisScreens.map(async it => {
        return new ReadOnlyPrisonResult(
          it.id,
          (await this.prisonerService.getPrisonsWithServiceCode(it.apiId)).map(i => i.prisonId),
        )
      }),
    )

    if (this.userPermissionService.allowNomisReadOnlyScreensConfigurationAccess(userRoles)) {
      return res.render('pages/configure/index', {
        model: new ConfigurationViewModel(activePrisons, readOnlyPrisonResults),
      })
    }
    return res.redirect('/search/prisoners')
  }

  public postConfig: RequestHandler = async (req, res) => {
    const currentEnabledPrisons = await this.prisonerService.getPrisonsWithServiceCode(req.body.apiId)
    const checkedBoxes = [req.body.checkedBoxes === undefined ? [] : req.body.checkedBoxes].flat()
    const redirectSection = readOnlyNomisScreens.find(it => it.apiId === req.body.apiId).id

    this.enableCheckedBoxes(checkedBoxes, currentEnabledPrisons, req.body.apiId)
    this.disableUncheckedBoxes(checkedBoxes, currentEnabledPrisons, req.body.apiId)

    res.redirect(`/config#${redirectSection}`)
  }

  private enableCheckedBoxes(checkedBoxes: string[], currentEnabledPrisons: PrisonApiPrisonDetails[], apiId: string) {
    checkedBoxes
      .filter(it => !currentEnabledPrisons.map(i => i.prisonId).includes(it))
      .forEach(it => this.prisonerService.postServiceCodeForPrison(apiId, it))
  }

  private disableUncheckedBoxes(
    checkedBoxes: string[],
    currentEnabledPrisons: PrisonApiPrisonDetails[],
    apiId: string,
  ) {
    currentEnabledPrisons
      .filter(it => !checkedBoxes.includes(it.prisonId))
      .forEach(it => this.prisonerService.deleteServiceCodeForPrison(apiId, it.prisonId))
  }
}
