import { Request } from 'express'
import { DateSelectConfiguration } from './manualEntryService'
import DateTypeConfigurationService, { FULL_STRING_LOOKUP } from './dateTypeConfigurationService'
import { ManualEntryDate } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

const approvedDatesConfig = {
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
      value: 'ROTL',
      checked: false,
      attributes: {},
      text: FULL_STRING_LOOKUP.ROTL,
    },
    {
      value: 'HDCAD',
      attributes: {},
      checked: false,
      text: FULL_STRING_LOOKUP.HDCAD,
    },
    {
      value: 'APD',
      attributes: {},
      checked: false,
      text: FULL_STRING_LOOKUP.APD,
    },
  ],
} as DateSelectConfiguration

const selectDatesError = {
  errorMessage: {
    text: 'Select at least one release date.',
  },
}
export default class ApprovedDatesService {
  constructor(private readonly dateTypeConfigurationService: DateTypeConfigurationService) {}

  public getConfig(req: Request): DateSelectConfiguration {
    const config = approvedDatesConfig
    this.enrichConfiguration(config, req, req.params.nomsId)
    return config
  }

  private enrichConfiguration(mergedConfig: DateSelectConfiguration, req: Request, nomsId: string) {
    // eslint-disable-next-line no-restricted-syntax
    for (const item of mergedConfig.items) {
      if (
        req.session.selectedApprovedDates[nomsId] &&
        req.session.selectedApprovedDates[nomsId].some((d: ManualEntryDate) => d.dateType === item.value)
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

  public submitApprovedDateTypes(req: Request): SubmitApprovedDateTypesResponse {
    if (req.body.dateSelect === undefined || req.body.dateSelect.length === 0) {
      const config = { ...approvedDatesConfig, ...selectDatesError }
      const error = true
      return { error, config }
    }
    const dates = this.dateTypeConfigurationService.configure(
      req.body.dateSelect,
      req.session.selectedApprovedDates[req.params.nomsId]
    )
    // Do validation here
    req.session.selectedApprovedDates[req.params.nomsId] = [
      ...req.session.selectedApprovedDates[req.params.nomsId],
      ...dates,
    ]
    const error = false
    return { error, config: null }
  }
}

export interface SubmitApprovedDateTypesResponse {
  error: boolean
  config: DateSelectConfiguration
}