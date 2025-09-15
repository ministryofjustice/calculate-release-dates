import { DateTypeDefinition } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import { ManualJourneySelectedDate } from '../types/ManualJourney'
import releaseDateType from '../enumerations/releaseDateType'

export default class DateTypeConfigurationService {
  public async configureViaBackend(
    token: string,
    dateList: string | string[],
    sessionList: ManualJourneySelectedDate[],
  ): Promise<ManualJourneySelectedDate[]> {
    let numberOfDates = sessionList.length
    const dateTypeDefinitions = await new CalculateReleaseDatesApiClient(token).getDateTypeDefinitions()
    const selectedDateTypes: string[] = Array.isArray(dateList) ? dateList : [dateList]
    return selectedDateTypes
      .filter(value => value !== undefined)
      .map((date: string): ManualJourneySelectedDate => {
        const existingDate = sessionList.find((d: ManualJourneySelectedDate) => d.dateType === date)
        if (existingDate && existingDate.manualEntrySelectedDate) {
          return {
            position: existingDate.position,
            completed: false,
            dateType: date,
            manualEntrySelectedDate: existingDate.manualEntrySelectedDate,
          }
        }
        numberOfDates += 1
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

  async dateTypeToDescriptionMapping(token: string): Promise<{ [key: string]: string }> {
    return new CalculateReleaseDatesApiClient(token).getDateTypeDefinitions().then((defs: DateTypeDefinition[]) => {
      return Object.fromEntries(defs.map(def => [def.type, this.fromDefinitionToDescription(def)]))
    })
  }

  private getDescription(dateTypeDefinitions: DateTypeDefinition[], date: string) {
    return this.fromDefinitionToDescription(dateTypeDefinitions.find((dtd: DateTypeDefinition) => dtd.type === date))
  }

  private fromDefinitionToDescription(def: DateTypeDefinition) {
    if (def.type === 'None') {
      return def.description
    }
    return `${def.type} (${def.description})`
  }
}
