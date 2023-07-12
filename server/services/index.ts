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
import BulkLoadService from './bulkLoadService'
import ManualEntryValidationService from './manualEntryValidationService'
import ApprovedDatesService from './approvedDatesService'
import DateTypeConfigurationService from './dateTypeConfigurationService'
import DateValidationService from './dateValidationService'

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
  const bulkLoadService = new BulkLoadService()
  const approvedDatesService = new ApprovedDatesService(dateTypeConfigurationService)
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
    bulkLoadService,
    approvedDatesService,
  }
}

export type Services = ReturnType<typeof services>
