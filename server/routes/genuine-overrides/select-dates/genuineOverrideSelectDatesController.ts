import { Request, Response } from 'express'
import { Controller } from '../../controller'
import GenuineOverrideUrls from '../genuineOverrideUrls'
import PrisonerService from '../../../services/prisonerService'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import GenuineOverrideSelectDatesViewModel from '../../../models/genuine-override/GenuineOverrideSelectDatesViewModel'
import { determinateDateTypesForManualEntry, SelectedDateCheckBox } from '../../../services/manualEntryService'
import { genuineOverrideInputsForPrisoner } from '../genuineOverrideUtils'
import CalculateReleaseDatesService from '../../../services/calculateReleaseDatesService'
import {
  convertValidationMessagesToErrorMessagesForPath,
  redirectToInputWithErrors,
} from '../../../middleware/validationMiddleware'
import { SelectDatesForm } from '../../common-schemas/selectDatesSchema'

export default class GenuineOverrideSelectDatesController implements Controller {
  constructor(
    private readonly dateTypeConfigurationService: DateTypeConfigurationService,
    private readonly prisonerService: PrisonerService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
  ) {}

  GET = async (req: Request<{ nomsId: string; calculationRequestId: string }>, res: Response): Promise<void> => {
    const { nomsId, calculationRequestId } = req.params
    const { caseloads, token, userRoles } = res.locals.user

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, userRoles)
    const dateTypeDefinitions = await this.dateTypeConfigurationService.dateTypeToDescriptionMapping(token)
    const genuineOverrideInputs = genuineOverrideInputsForPrisoner(req, nomsId)
    const pendingDateTypes: string[] =
      res.locals.formResponses?.dateType ?? genuineOverrideInputs.datesBeingAdded?.map(it => it.type) ?? []
    const checkboxes: SelectedDateCheckBox[] = determinateDateTypesForManualEntry.map(dateType => {
      const hasEnteredDate = genuineOverrideInputs.datesToSave?.find(it => it.type === dateType) !== undefined
      const hasPendingDate = pendingDateTypes?.find(it => it === dateType) !== undefined
      return {
        value: dateType,
        text: dateTypeDefinitions[dateType],
        checked: hasEnteredDate || hasPendingDate,
        attributes: hasEnteredDate
          ? { disabled: true, 'data-qa': `checkbox-${dateType}` }
          : { 'data-qa': `checkbox-${dateType}` },
      }
    })

    return res.render(
      'pages/genuineOverrides/dateTypeSelection',
      new GenuineOverrideSelectDatesViewModel(
        prisonerDetail,
        checkboxes,
        GenuineOverrideUrls.reviewDatesForOverride(nomsId, calculationRequestId),
        GenuineOverrideUrls.selectDatesToAdd(nomsId, calculationRequestId),
      ),
    )
  }

  POST = async (
    req: Request<{ nomsId: string; calculationRequestId: string }, unknown, SelectDatesForm>,
    res: Response,
  ): Promise<void> => {
    const { nomsId, calculationRequestId } = req.params
    const { dateType } = req.body
    const { token } = res.locals.user
    const genuineOverrideInputs = genuineOverrideInputsForPrisoner(req, nomsId)
    const alreadyAddedDateTypes = genuineOverrideInputs.datesToSave?.map(it => it.type) ?? []
    const newDatesToAdd = dateType
      .filter(requestedDateType => !alreadyAddedDateTypes.includes(requestedDateType))
      .map(type => ({ type }))
    // if they just submitted without selecting any new dates take them back to review dates
    if (!newDatesToAdd || newDatesToAdd.length === 0) {
      return res.redirect(GenuineOverrideUrls.reviewDatesForOverride(nomsId, calculationRequestId))
    }
    const validationMessages = await this.calculateReleaseDatesService.validateDatesForGenuineOverride(token, [
      ...genuineOverrideInputs.datesToSave.map(it => it.type),
      ...newDatesToAdd.map(it => it.type),
    ])
    if (validationMessages.length) {
      return redirectToInputWithErrors(
        req,
        res,
        convertValidationMessagesToErrorMessagesForPath('dateType', validationMessages),
      )
    }
    genuineOverrideInputs.datesBeingAdded = newDatesToAdd
    const firstDateType = genuineOverrideInputs.datesBeingAdded[0].type
    return res.redirect(GenuineOverrideUrls.enterNewDate(nomsId, calculationRequestId, firstDateType))
  }
}
