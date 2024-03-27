import {
  DateTypeDefinition,
  ManualEntrySelectedDate,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'

export default class DateTypeConfigurationService {
  public async configureViaBackend(
    token: string,
    dateList: string | string[],
    sessionList: ManualEntrySelectedDate[],
  ): Promise<ManualEntrySelectedDate[]> {
    const dateTypeDefinitions = await new CalculateReleaseDatesApiClient(token).getDateTypeDefinitions()
    const selectedDateTypes: string[] = Array.isArray(dateList) ? dateList : [dateList]
    return selectedDateTypes
      .map((date: string) => {
        if (date !== undefined) {
          const existingDate = sessionList.find((d: ManualEntrySelectedDate) => d !== undefined && d.dateType === date)
          if (existingDate) {
            return {
              dateType: date,
              dateText: this.getDescription(dateTypeDefinitions, date),
              date: existingDate.date,
            } as ManualEntrySelectedDate
          }
          return {
            dateType: date,
            dateText: this.getDescription(dateTypeDefinitions, date),
            date: undefined,
          } as ManualEntrySelectedDate
        }
        return null
      })
      .filter(obj => obj !== null)
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
