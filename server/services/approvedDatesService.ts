import { Request } from 'express'
import { DateSelectConfiguration } from './manualEntryService'
import DateTypeConfigurationService from './dateTypeConfigurationService'
import { ManualEntrySelectedDate } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { ManualJourneySelectedDate } from '../types/ManualJourney'

const selectDatesError = {
  errorMessage: {
    text: 'Select at least one release date.',
  },
}
export default class ApprovedDatesService {
  constructor(private readonly dateTypeConfigurationService: DateTypeConfigurationService) {
    // intentionally left blank
  }

  public async getConfig(token: string, req: Request): Promise<DateSelectConfiguration> {
    const config = await this.getApprovedDatesConfig(token)
    this.enrichConfiguration(config, req, req.params.nomsId)
    return config
  }

  private enrichConfiguration(mergedConfig: DateSelectConfiguration, req: Request, nomsId: string) {
    for (const item of mergedConfig.items) {
      if (
        req.session.selectedApprovedDates[nomsId] &&
        req.session.selectedApprovedDates[nomsId].some((d: ManualEntrySelectedDate) => d.dateType === item.value)
      ) {
        item.checked = true
        item.attributes = {
          disabled: true,
        }
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
    const dates = await this.dateTypeConfigurationService.configureViaBackend(
      token,
      req.body.dateSelect,
      req.session.selectedApprovedDates[req.params.nomsId],
    )
    // Do validation here
    req.session.selectedApprovedDates[req.params.nomsId] = [
      ...req.session.selectedApprovedDates[req.params.nomsId],
      ...dates,
    ]
    const error = false
    return { error, config: null }
  }

  public async changeDate(token: string, req: Request, nomsId: string): Promise<ManualJourneySelectedDate> {
    await this.dateTypeConfigurationService.dateTypeToDescriptionMapping(token)
    const date = req.session.selectedApprovedDates[nomsId].find(
      (d: ManualEntrySelectedDate) => d.dateType === req.query.dateType,
    )
    req.session.selectedApprovedDates[nomsId] = req.session.selectedApprovedDates[nomsId].filter(
      (d: ManualEntrySelectedDate) => d.dateType !== req.query.dateType,
    )
    const manualJourneySelectedDate: ManualJourneySelectedDate = {
      position: 1,
      dateType: date.dateType,
      manualEntrySelectedDate: date,
      completed: false,
    }

    req.session.selectedApprovedDates[nomsId].push(manualJourneySelectedDate)
    return manualJourneySelectedDate
  }

  public removeDate(req: Request, nomsId: string) {
    const dateToRemove = req.query.dateType
    if (req.body['remove-date'] === 'yes') {
      req.session.selectedApprovedDates[nomsId] = req.session.selectedApprovedDates[nomsId].filter(
        (d: ManualEntrySelectedDate) => d.dateType !== dateToRemove,
      )
    }
  }

  public hasApprovedDateToRemove(req: Request, nomsId: string, dateToRemove: string): boolean {
    return req.session.selectedApprovedDates[nomsId].some((d: ManualEntrySelectedDate) => d.dateType === dateToRemove)
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
