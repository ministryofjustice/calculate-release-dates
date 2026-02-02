import { DateTypeDefinition } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { ManualJourneySelectedDate } from '../types/ManualJourney'
import releaseDateType from '../enumerations/releaseDateType'
import CalculateReleaseDatesApiRestClient from '../data/calculateReleaseDatesApiRestClient'

export default class DateTypeConfigurationService {
  constructor(private readonly calculateReleaseDatesApiRestClient: CalculateReleaseDatesApiRestClient) {}

  public async configureViaBackend(
    username: string,
    dateList: string | string[],
    sessionList: ManualJourneySelectedDate[],
  ): Promise<ManualJourneySelectedDate[]> {
    const dateTypeDefinitions = await this.calculateReleaseDatesApiRestClient.getDateTypeDefinitions(username)
    const selectedDateTypes: string[] = Array.isArray(dateList) ? dateList : [dateList]
    const newSessionList = sessionList.filter((d: ManualJourneySelectedDate) => selectedDateTypes.includes(d.dateType))
    let numberOfDates = 0
    return selectedDateTypes
      .filter(value => value !== undefined)
      .map((date: string): ManualJourneySelectedDate => {
        const existingDate = newSessionList.find((d: ManualJourneySelectedDate) => d.dateType === date)
        numberOfDates += 1
        if (existingDate && existingDate.manualEntrySelectedDate) {
          return {
            position: numberOfDates,
            completed: false,
            dateType: date,
            manualEntrySelectedDate: existingDate.manualEntrySelectedDate,
          }
        }
        return {
          position: numberOfDates,
          completed: false,
          dateType: date,
          manualEntrySelectedDate: {
            date: undefined,
            dateType: date as releaseDateType,
            dateText: this.getDescription(dateTypeDefinitions, date),
          },
        }
      })
  }

  async dateTypeToDescriptionMapping(
    username: string,
    format: 'COMBINED' | 'DESCRIPTION_ONLY' = 'COMBINED',
  ): Promise<{ [key: string]: string }> {
    return this.calculateReleaseDatesApiRestClient
      .getDateTypeDefinitions(username)
      .then((defs: DateTypeDefinition[]) => {
        return Object.fromEntries(defs.map(def => [def.type, this.fromDefinitionToDescription(def, format)]))
      })
  }

  getDescription(
    dateTypeDefinitions: DateTypeDefinition[],
    date: string,
    format: 'COMBINED' | 'DESCRIPTION_ONLY' = 'COMBINED',
  ) {
    return this.fromDefinitionToDescription(
      dateTypeDefinitions.find((dtd: DateTypeDefinition) => dtd.type === date),
      format,
    )
  }

  fromDefinitionToDescription(def: DateTypeDefinition, format: 'COMBINED' | 'DESCRIPTION_ONLY' = 'COMBINED') {
    if (def.type === 'None') {
      return def.description
    }
    if (format === 'COMBINED') {
      return `${def.type} (${def.description})`
    }
    return def.description
  }
}
