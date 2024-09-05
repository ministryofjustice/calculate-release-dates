import {
  DesignSystemEnvironment,
  MiniProfileConfig,
  ServiceHeaderConfig,
} from 'hmpps-court-cases-release-dates-design/hmpps/@types'

export default interface CommonElementConfig {
  environment: DesignSystemEnvironment
  prisonNumber?: string
  establishmentCode?: string
  serviceHeader: ServiceHeaderConfig
  miniProfile?: MiniProfileConfig
}
