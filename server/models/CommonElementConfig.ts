import {
  DesignSystemEnvironment,
  MiniProfileConfig,
  ServiceHeaderConfig,
} from 'hmpps-design-system-frontend/hmpps/@types'

export default interface CommonElementConfig {
  environment: DesignSystemEnvironment
  prisonNumber?: string
  serviceHeader: ServiceHeaderConfig
  miniProfile?: MiniProfileConfig
}
