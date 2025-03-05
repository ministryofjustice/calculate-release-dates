import CalculateReleaseDatesService from './calculateReleaseDatesService'
import UserService from './userService'
import PrisonerService from './prisonerService'
import ViewReleaseDatesService from './viewReleaseDatesService'
import UserInputService from './userInputService'
import { dataAccess } from '../data'
import ManualCalculationService from './manualCalculationService'
import ManualEntryService from './manualEntryService'
import UserPermissionsService from './userPermissionsService'
import ApprovedDatesService from './approvedDatesService'
import DateTypeConfigurationService from './dateTypeConfigurationService'
import DateValidationService from './dateValidationService'
import CheckInformationService from './checkInformationService'
import FrontEndComponentsService from './frontEndComponentsService'
import FrontendComponentsApiClient from '../api/frontendComponentsApiClient'
import ComparisonService from './comparisonService'
import CourtCasesReleaseDatesService from './courtCasesReleaseDatesService'
import AuditService from './auditService'

export const services = () => {
  const { applicationInfo, hmppsAuthClient, manageUsersApiClient } = dataAccess()
  const auditService = new AuditService()
  const calculateReleaseDatesService = new CalculateReleaseDatesService(auditService)
  const prisonerService = new PrisonerService(hmppsAuthClient)
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
  const checkInformationService = new CheckInformationService(
    calculateReleaseDatesService,
    prisonerService,
    userInputService,
  )
  const frontEndComponentService = new FrontEndComponentsService(new FrontendComponentsApiClient())
  const comparisonService = new ComparisonService()
  const courtCasesReleaseDatesService = new CourtCasesReleaseDatesService()

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
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
