import { Request } from 'express'
import { GenuineOverrideInputs } from '../../models/genuine-override/genuineOverrideInputs'
import { filteredListOfDates } from '../../views/pages/components/calculation-summary-dates-card/CalculationSummaryDatesCardModel'
import config from '../../config'
import AuthorisedRoles from '../../enumerations/authorisedRoles'

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

export { genuineOverrideInputsForPrisoner, sortDatesForGenuineOverride, hasGenuineOverridesAccess }
