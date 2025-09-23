import { Request } from 'express'
import { DateSelectConfiguration } from './manualEntryService'
import DateTypeConfigurationService from './dateTypeConfigurationService'
import { ManualJourneySelectedDate } from '../types/ManualJourney'

const selectDatesError = {
  errorMessage: {
    text: 'Select at least one release date.',
  },
}
export default class ApprovedDatesService {
  constructor(private readonly dateTypeConfigurationService: DateTypeConfigurationService) {}

  public async getConfig(token: string, req: Request): Promise<DateSelectConfiguration> {
    const config = await this.getApprovedDatesConfig(token)
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

  public async submitApprovedDateTypes(token: string, req: Request): Promise<SubmitApprovedDateTypesResponse> {
    if (req.body.dateSelect === undefined || req.body.dateSelect.length === 0) {
      const config = await this.getApprovedDatesConfig(token)
      return { error: true, config: { ...config, ...selectDatesError } }
    }

    req.session.selectedApprovedDates[req.params.nomsId] = await this.dateTypeConfigurationService.configureViaBackend(
      token,
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

  private async getApprovedDatesConfig(token: string): Promise<DateSelectConfiguration> {
    const dateTypeToDescriptionMapping = await this.dateTypeConfigurationService.dateTypeToDescriptionMapping(token)
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
