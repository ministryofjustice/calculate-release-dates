import { Request } from 'express'
import { DateSelectConfiguration } from './manualEntryService'
import DateTypeConfigurationService from './dateTypeConfigurationService'
import { ManualJourneySelectedDate } from '../types/ManualJourney'
import { DetailedCalculationResults } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

const selectDatesError = {
  errorMessage: {
    text: 'Select at least one release date.',
  },
}
const hdcadMissingHdcedError = {
  errorMessage: {
    text: 'HDCAD cannot be added because a HDCED was not part of the calculated dates. A HDCED must be accompanied by a HDCAD.',
  },
}
export default class ApprovedDatesService {
  constructor(private readonly dateTypeConfigurationService: DateTypeConfigurationService) {}

  public async getConfig(username: string, req: Request): Promise<DateSelectConfiguration> {
    const config = await this.getApprovedDatesConfig(username)
    this.enrichConfiguration(config, req, req.params.nomsId)
    return config
  }

  private enrichConfiguration(mergedConfig: DateSelectConfiguration, req: Request, nomsId: string) {
    for (const item of mergedConfig.items) {
      if (
        req.session.selectedApprovedDates[nomsId] &&
        req.session.selectedApprovedDates[nomsId].some((d: ManualJourneySelectedDate) => d.dateType === item.value)
      ) {
        item.checked = true
      } else {
        item.checked = false
        item.attributes = {}
      }
    }
  }

  public async submitApprovedDateTypes(
    req: Request,
    username: string,
    detailedCalculationResults: DetailedCalculationResults,
  ): Promise<SubmitApprovedDateTypesResponse> {
    if (req.body.dateSelect === undefined || req.body.dateSelect.length === 0) {
      const config = await this.getApprovedDatesConfig(username)
      return { error: true, config: { ...config, ...selectDatesError } }
    }

    const selectedDateTypes: string[] = Array.isArray(req.body.dateSelect) ? req.body.dateSelect : [req.body.dateSelect]
    const isHdcedInCalc = detailedCalculationResults.dates.HDCED !== undefined
    const isHdcadSelected = selectedDateTypes.includes('HDCAD')

    if (!isHdcedInCalc && isHdcadSelected) {
      const config = await this.getApprovedDatesConfig(username)
      return { error: true, config: { ...config, ...hdcadMissingHdcedError } }
    }

    req.session.selectedApprovedDates[req.params.nomsId] = await this.dateTypeConfigurationService.configureViaBackend(
      username,
      req.body.dateSelect,
      req.session.selectedApprovedDates[req.params.nomsId],
    )
    const error = false
    return { error, config: null }
  }

  public removeDate(req: Request, nomsId: string) {
    const dateToRemove = req.query.dateType
    if (req.body['remove-date'] === 'yes') {
      req.session.selectedApprovedDates[nomsId] = req.session.selectedApprovedDates[nomsId].filter(
        (d: ManualJourneySelectedDate) => d.dateType !== dateToRemove,
      )
    }
  }

  public hasApprovedDateToRemove(req: Request, nomsId: string, dateToRemove: string): boolean {
    return req.session.selectedApprovedDates[nomsId].some((d: ManualJourneySelectedDate) => d.dateType === dateToRemove)
  }

  private async getApprovedDatesConfig(username: string): Promise<DateSelectConfiguration> {
    const dateTypeToDescriptionMapping = await this.dateTypeConfigurationService.dateTypeToDescriptionMapping(username)
    return {
      name: 'dateSelect',
      fieldset: {
        legend: {
          text: 'Select the dates you need to enter',
          isPageHeading: true,
          classes: 'govuk-fieldset__legend--xl',
        },
      },
      hint: {
        text: 'Select all that apply.',
      },
      items: [
        {
          value: 'APD',
          attributes: {},
          checked: false,
          text: dateTypeToDescriptionMapping.APD,
        },
        {
          value: 'HDCAD',
          attributes: {},
          checked: false,
          text: dateTypeToDescriptionMapping.HDCAD,
        },
        {
          value: 'ROTL',
          checked: false,
          attributes: {},
          text: dateTypeToDescriptionMapping.ROTL,
        },
      ],
    } as DateSelectConfiguration
  }
}

export interface SubmitApprovedDateTypesResponse {
  error: boolean
  config: DateSelectConfiguration
}
