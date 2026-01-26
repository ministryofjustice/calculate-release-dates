import CalculateReleaseDatesService from './calculateReleaseDatesService'
import UserService from './userService'
import PrisonerService from './prisonerService'
import ViewReleaseDatesService from './viewReleaseDatesService'
import UserInputService from './userInputService'
import dataAccess from '../data'
import ManualCalculationService from './manualCalculationService'
import ManualEntryService from './manualEntryService'
import UserPermissionsService from './userPermissionsService'
import ApprovedDatesService from './approvedDatesService'
import DateTypeConfigurationService from './dateTypeConfigurationService'
import DateValidationService from './dateValidationService'
import CheckInformationService from './checkInformationService'
import FrontEndComponentsService from './frontEndComponentsService'
import ComparisonService from './comparisonService'
import CourtCasesReleaseDatesService from './courtCasesReleaseDatesService'
import AuditService from './auditService'

export const services = () => {
  const {
    applicationInfo,
    manageUsersApiClient,
    prisonApiClient,
    prisonerSearchApiClient,
    courtCasesReleaseDatesApiClient,
    frontendComponentsApiClient,
    calculateReleaseDatesApiClient,
  } = dataAccess()
  const auditService = new AuditService()

  const calculateReleaseDatesService = new CalculateReleaseDatesService(auditService, calculateReleaseDatesApiClient)
  const prisonerService = new PrisonerService(prisonerSearchApiClient, prisonApiClient)
  const userService = new UserService(manageUsersApiClient, prisonerService)
  const viewReleaseDatesService = new ViewReleaseDatesService()
  const userInputService = new UserInputService()
  const manualCalculationService = new ManualCalculationService(auditService)
  const dateTypeConfigurationService = new DateTypeConfigurationService()
  const dateValidationService = new DateValidationService()
  const manualEntryService = new ManualEntryService(
    dateTypeConfigurationService,
    dateValidationService,
    calculateReleaseDatesService,
  )
  const userPermissionsService = new UserPermissionsService()
  const approvedDatesService = new ApprovedDatesService(dateTypeConfigurationService)
  const checkInformationService = new CheckInformationService(calculateReleaseDatesService, prisonerService)
  const frontEndComponentService = new FrontEndComponentsService(frontendComponentsApiClient)
  const comparisonService = new ComparisonService(auditService)
  const courtCasesReleaseDatesService = new CourtCasesReleaseDatesService(courtCasesReleaseDatesApiClient)

  return {
    applicationInfo,
    userService,
    prisonerService,
    calculateReleaseDatesService,
    viewReleaseDatesService,
    userInputService,
    manualCalculationService,
    manualEntryService,
    userPermissionsService,
    approvedDatesService,
    checkInformationService,
    frontEndComponentService,
    comparisonService,
    courtCasesReleaseDatesService,
    auditService,
    dateTypeConfigurationService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
