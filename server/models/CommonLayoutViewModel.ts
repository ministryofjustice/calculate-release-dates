import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import CommonElementConfig from './CommonElementConfig'
import { hmppsDesignSystemsEnvironmentName } from '../utils/utils'

export default class CommonLayoutViewModel {
  public commonElementConfig: CommonElementConfig

  constructor(prisonerDetail?: PrisonApiPrisoner) {
    this.commonElementConfig = {
      serviceHeader: {
        environment: hmppsDesignSystemsEnvironmentName(),
        prisonNumber: prisonerDetail?.offenderNo,
      },
    }
  }
}
