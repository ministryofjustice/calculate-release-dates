import CalculateReleaseDatesService from './calculateReleaseDatesService'
import UserService from './userService'
import PrisonerService from './prisonerService'
import EntryPointService from './entryPointService'
import ViewReleaseDatesService from './viewReleaseDatesService'
import UserInputService from './userInputService'
import { dataAccess } from '../data'
import OneThousandCalculationsService from './oneThousandCalculationsService'
import ManualCalculationService from './manualCalculationService'

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

  return {
    userService,
    prisonerService,
    calculateReleaseDatesService,
    entryPointService,
    viewReleaseDatesService,
    userInputService,
    oneThousandCalculationsService,
    manualCalculationService,
  }
}

export type Services = ReturnType<typeof services>
