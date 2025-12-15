import { Request } from 'express'
import config from '../../config'
import GenuineOverrideUrls from './genuineOverrideUrls'
import { GenuineOverrideInputs, NewDate } from '../../@types/journeys'

const genuineOverrideInputsForPrisoner = (req: Request, prisonerNumber: string): GenuineOverrideInputs => {
  const { session } = req
  if (!session.genuineOverrideInputs || !session.genuineOverrideInputs[prisonerNumber]) {
    throw Error(`No session state found for genuine override for prisoner ${prisonerNumber}. Session may have expired`)
  }
  return session.genuineOverrideInputs[prisonerNumber]
}

const hasGenuineOverridesAccess = (): boolean => {
  return config.featureToggles.genuineOverridesEnabled
}

const getGenuineOverridePreviousDateUrl = (
  prisonerNumber: string,
  calculationRequestId: string | number,
  currentDateType: string,
  datesBeingAdded: NewDate[],
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
  datesBeingAdded: NewDate[],
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
  hasGenuineOverridesAccess,
  getGenuineOverridePreviousDateUrl,
  getGenuineOverrideNextAction,
}
