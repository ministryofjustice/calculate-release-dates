import { PrisonApiPrison } from '../@types/prisonApi/prisonClientTypes'
import readOnlyNomisScreens from './ReadOnlyNomisScreens'
import ReadOnlyPrisonResult from '../types/ReadOnlyPrisonResult'

export default class ConfigurationViewModel {
  constructor(
    public allPrisons: PrisonApiPrison[],
    public readOnlyPrisonResults: ReadOnlyPrisonResult[],
  ) {}

  public checkboxes(adjustmentId: string) {
    const displayText = readOnlyNomisScreens.find(it => it.id === adjustmentId).display
    return {
      classes: 'govuk-checkboxes--small',
      name: 'checkedBoxes',
      fieldset: {
        legend: {
          text: `Select the status of the ${displayText} screen`,
          isPageHeading: true,
          classes: 'govuk-fieldset__legend--l',
        },
      },
      hint: { text: `Checked prisons are read only` },
      items: this.getItems(adjustmentId),
    }
  }

  public tabs() {
    return readOnlyNomisScreens.map(it => {
      const readOnlyPrisonCount = this.readOnlyPrisonResults.find(i => it.id === i.id).prisonIds.length
      return {
        id: it.id,
        display: `${it.display} (${readOnlyPrisonCount}/${this.allPrisons.length})`,
        table: this.checkboxes(it.id),
        apiId: it.apiId,
      }
    })
  }

  private getItems(adjustmentId: string) {
    const readOnlyPrisons = this.readOnlyPrisonResults.filter(it => it.id === adjustmentId).flatMap(it => it.prisonIds)
    return this.allPrisons.map(it => {
      return { text: it.description, value: it.agencyId, checked: readOnlyPrisons.includes(it.agencyId) }
    })
  }
}
