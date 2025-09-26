import { Request } from 'express'
import { GenuineOverrideInputs, NewGenuineOverrideDate } from '../../models/genuine-override/genuineOverrideInputs'
import { filteredListOfDates } from '../../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'
import config from '../../config'
import AuthorisedRoles from '../../enumerations/authorisedRoles'
import GenuineOverrideUrls from './genuineOverrideUrls'

const genuineOverrideInputsForPrisoner = (req: Request, prisonerNumber: string): GenuineOverrideInputs => {
  const { session } = req
  if (!session.genuineOverrideInputs) {
    session.genuineOverrideInputs = {}
  }
  if (!session.genuineOverrideInputs[prisonerNumber]) {
    session.genuineOverrideInputs[prisonerNumber] = {}
  }
  return session.genuineOverrideInputs[prisonerNumber]
}

const sortDatesForGenuineOverride = (dates: { type: string }[]): { type: string }[] => {
  return dates.sort((a, b) => filteredListOfDates.indexOf(a.type) - filteredListOfDates.indexOf(b.type))
}

const hasGenuineOverridesAccess = (roles: string[]): boolean => {
  return (
    config.featureToggles.genuineOverridesEnabled && roles.includes(AuthorisedRoles.ROLE_CRD__GENUINE_OVERRIDES__RW)
  )
}

const getGenuineOverridePreviousDateUrl = (
  prisonerNumber: string,
  calculationRequestId: string | number,
  currentDateType: string,
  datesBeingAdded: NewGenuineOverrideDate[],
): string => {
  const currentIndex = datesBeingAdded.findIndex(it => it.type === currentDateType)
  const previous = currentIndex - 1
  if (previous < 0) {
    return GenuineOverrideUrls.selectDatesToAdd(prisonerNumber, calculationRequestId)
  }
  return GenuineOverrideUrls.enterNewDate(prisonerNumber, calculationRequestId, datesBeingAdded[previous].type)
}

const getGenuineOverrideNextAction = (
  prisonerNumber: string,
  calculationRequestId: string | number,
  currentDateType: string,
  datesBeingAdded: NewGenuineOverrideDate[],
): {
  action: 'NEXT_DATE' | 'SAVE_ALL_DATES'
  url: string
} => {
  const currentIndex = datesBeingAdded.findIndex(it => it.type === currentDateType)
  const nextIndex = Math.min(currentIndex + 1, datesBeingAdded.length)
  if (nextIndex === datesBeingAdded.length) {
    return {
      action: 'SAVE_ALL_DATES',
      url: GenuineOverrideUrls.reviewDatesForOverride(prisonerNumber, calculationRequestId),
    }
  }
  return {
    action: 'NEXT_DATE',
    url: GenuineOverrideUrls.enterNewDate(prisonerNumber, calculationRequestId, datesBeingAdded[nextIndex].type),
  }
}

export {
  genuineOverrideInputsForPrisoner,
  sortDatesForGenuineOverride,
  hasGenuineOverridesAccess,
  getGenuineOverridePreviousDateUrl,
  getGenuineOverrideNextAction,
}
