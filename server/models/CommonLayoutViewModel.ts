import { MiniProfileConfig } from 'hmpps-court-cases-release-dates-design/hmpps/@types'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import CommonElementConfig from './CommonElementConfig'
import { hmppsDesignSystemsEnvironmentName } from '../utils/utils'

export default class CommonLayoutViewModel {
  public commonElementConfig: CommonElementConfig

  constructor(prisonerDetail?: PrisonApiPrisoner) {
    let miniProfile: MiniProfileConfig
    if (prisonerDetail) {
      miniProfile = {
        person: {
          prisonerNumber: prisonerDetail.offenderNo,
          firstName: prisonerDetail.firstName,
          lastName: prisonerDetail.lastName,
          dateOfBirth: prisonerDetail.dateOfBirth,
          status: prisonerDetail.imprisonmentStatusDescription,
          prisonName: prisonerDetail.assignedLivingUnit?.agencyName,
          cellLocation: prisonerDetail.assignedLivingUnit?.description,
        },
        profileUrl: `/prisoner/${prisonerDetail.offenderNo}`,
        imageUrl: `/prisoner/${prisonerDetail.offenderNo}/image`,
      }
    }
    const env = hmppsDesignSystemsEnvironmentName()
    this.commonElementConfig = {
      environment: env,
      prisonNumber: prisonerDetail?.offenderNo,
      serviceHeader: {
        environment: env,
        prisonNumber: prisonerDetail?.offenderNo,
      },
      miniProfile,
      establishmentCode: prisonerDetail?.agencyId,
    }
  }
}
