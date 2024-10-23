export default class ReadOnlyPrisonResult {
  public id: string

  public prisonIds: string[]

  constructor(id: string, prisonIds: string[]) {
    this.id = id
    this.prisonIds = prisonIds
  }
}
