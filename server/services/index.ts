import CalculateReleaseDatesService from './calculateReleaseDatesService'
import UserService from './userService'
import PrisonerService from './prisonerService'
import EntryPointService from './entryPointService'
import ViewReleaseDatesService from './viewReleaseDatesService'
import UserInputService from './userInputService'
import { dataAccess } from '../data'
import OneThousandCalculationsService from './oneThousandCalculationsService'
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

export const services = () => {
  const { hmppsAuthClient } = dataAccess()
  const userService = new UserService(hmppsAuthClient)
  const calculateReleaseDatesService = new CalculateReleaseDatesService()
  const prisonerService = new PrisonerService(hmppsAuthClient)
  const entryPointService = new EntryPointService()
  const viewReleaseDatesService = new ViewReleaseDatesService()
  const userInputService = new UserInputService()
  const oneThousandCalculationsService = new OneThousandCalculationsService(
    prisonerService,
    calculateReleaseDatesService
  )
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

  return {
    userService,
    prisonerService,
    calculateReleaseDatesService,
    entryPointService,
    viewReleaseDatesService,
    userInputService,
    oneThousandCalculationsService,
    manualCalculationService,
    manualEntryService,
    userPermissionsService,
    approvedDatesService,
    checkInformationService,
    questionsService,
    frontEndComponentService,
  }
}

export type Services = ReturnType<typeof services>
