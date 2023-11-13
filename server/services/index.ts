import CalculateReleaseDatesService from './calculateReleaseDatesService'
import UserService from './userService'
import PrisonerService from './prisonerService'
import EntryPointService from './entryPointService'
import ViewReleaseDatesService from './viewReleaseDatesService'
import UserInputService from './userInputService'
import { dataAccess } from '../data'
import ManualCalculationService from './manualCalculationService'
import ManualEntryService from './manualEntryService'
import UserPermissionsService from './userPermissionsService'
import ManualEntryValidationService from './manualEntryValidationService'
import ApprovedDatesService from './approvedDatesService'
import DateTypeConfigurationService from './dateTypeConfigurationService'
import DateValidationService from './dateValidationService'
import QuestionsService from './questionsService'
import CheckInformationService from './checkInformationService'
import FrontEndComponentsService from './frontEndComponentsService'
import FrontendComponentsApiClient from '../api/frontendComponentsApiClient'
import ComparisonService from './comparisonService'

export const services = () => {
  const { hmppsAuthClient, manageUsersApiClient } = dataAccess()
  const userService = new UserService(manageUsersApiClient)
  const calculateReleaseDatesService = new CalculateReleaseDatesService()
  const prisonerService = new PrisonerService(hmppsAuthClient)
  const entryPointService = new EntryPointService()
  const viewReleaseDatesService = new ViewReleaseDatesService()
  const userInputService = new UserInputService()
  const manualCalculationService = new ManualCalculationService()
  const manualEntryValidationService = new ManualEntryValidationService()
  const dateTypeConfigurationService = new DateTypeConfigurationService()
  const dateValidationService = new DateValidationService()
  const manualEntryService = new ManualEntryService(
    manualEntryValidationService,
    dateTypeConfigurationService,
    dateValidationService
  )
  const userPermissionsService = new UserPermissionsService()
  const approvedDatesService = new ApprovedDatesService(dateTypeConfigurationService)
  const questionsService = new QuestionsService(calculateReleaseDatesService, userInputService)
  const checkInformationService = new CheckInformationService(
    calculateReleaseDatesService,
    prisonerService,
    entryPointService,
    userInputService
  )
  const frontEndComponentService = new FrontEndComponentsService(new FrontendComponentsApiClient())
  const comparisonService = new ComparisonService()

  return {
    userService,
    prisonerService,
    calculateReleaseDatesService,
    entryPointService,
    viewReleaseDatesService,
    userInputService,
    manualCalculationService,
    manualEntryService,
    userPermissionsService,
    approvedDatesService,
    checkInformationService,
    questionsService,
    frontEndComponentService,
    comparisonService,
  }
}

export type Services = ReturnType<typeof services>
