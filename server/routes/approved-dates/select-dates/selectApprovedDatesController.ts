import { Request, Response } from 'express'
import { Controller } from '../../controller'
import PrisonerService from '../../../services/prisonerService'
import DateTypeConfigurationService from '../../../services/dateTypeConfigurationService'
import { SelectedDateCheckBox } from '../../../services/manualEntryService'
import { PersonJourneyParams } from '../../../@types/journeys'
import { SelectDatesForm } from '../../common-schemas/selectDatesSchema'
import ApprovedDatesUrls from '../approvedDateUrls'
import SelectApprovedDatesViewModel from '../../../models/approved-dates/SelectApprovedDatesViewModel'
import { approvedDateTypes } from '../approvedDatesUtils'

export default class SelectApprovedDatesController implements Controller {
  constructor(
    private readonly dateTypeConfigurationService: DateTypeConfigurationService,
    private readonly prisonerService: PrisonerService,
  ) {}

  GET = async (req: Request<PersonJourneyParams>, res: Response): Promise<void> => {
    const { nomsId, journeyId } = req.params
    const { caseloads, userRoles, username } = res.locals.user

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, username, caseloads, userRoles)
    const dateTypeDefinitions = await this.dateTypeConfigurationService.dateTypeToDescriptionMapping(username)
    const journey = req.session.approvedDatesJourneys[journeyId]
    const pendingDateTypes: string[] =
      res.locals.formResponses?.dateType ?? journey.datesBeingAdded?.map(it => it.type) ?? []
    const checkboxes: SelectedDateCheckBox[] = approvedDateTypes.map(dateType => {
      const hasEnteredDate = journey.datesToSave?.find(it => it.type === dateType) !== undefined
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

    let backLink: string
    if (journey.datesToSave.length === 0) {
      backLink = ApprovedDatesUrls.reviewCalculatedDates(nomsId, journeyId)
    } else {
      backLink = ApprovedDatesUrls.reviewApprovedDates(nomsId, journeyId)
    }

    return res.render(
      'pages/approvedDates/standalone/dateTypeSelection',
      new SelectApprovedDatesViewModel(
        prisonerDetail,
        checkboxes,
        backLink,
        ApprovedDatesUrls.selectDatesToAdd(nomsId, journeyId),
      ),
    )
  }

  POST = async (req: Request<PersonJourneyParams, unknown, SelectDatesForm>, res: Response): Promise<void> => {
    const { nomsId, journeyId } = req.params
    const { dateType } = req.body
    const journey = req.session.approvedDatesJourneys[journeyId]
    const alreadyAddedDateTypes = journey.datesToSave?.map(it => it.type) ?? []
    const newDatesToAdd = dateType
      .filter(requestedDateType => !alreadyAddedDateTypes.includes(requestedDateType))
      .map(type => ({ type }))
    // if they just submitted without selecting any new dates take them back to review dates
    if (!newDatesToAdd || newDatesToAdd.length === 0) {
      return res.redirect(ApprovedDatesUrls.reviewApprovedDates(nomsId, journeyId))
    }
    journey.datesBeingAdded = newDatesToAdd
    const firstDateType = journey.datesBeingAdded[0].type
    return res.redirect(ApprovedDatesUrls.enterNewDate(nomsId, journeyId, firstDateType))
  }
}
