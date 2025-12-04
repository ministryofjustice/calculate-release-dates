import { NewDate } from '../../@types/journeys'
import ApprovedDatesUrls from './approvedDateUrls'

const getApprovedDatePreviousDateUrl = (
  prisonerNumber: string,
  journeyId: string,
  currentDateType: string,
  datesBeingAdded: NewDate[],
): string => {
  const currentIndex = datesBeingAdded.findIndex(it => it.type === currentDateType)
  const previous = currentIndex - 1
  if (previous < 0) {
    return ApprovedDatesUrls.selectDatesToAdd(prisonerNumber, journeyId)
  }
  return ApprovedDatesUrls.enterNewDate(prisonerNumber, journeyId, datesBeingAdded[previous].type)
}

const getApprovedDatesNextAction = (
  prisonerNumber: string,
  journeyId: string,
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
      url: ApprovedDatesUrls.reviewApprovedDates(prisonerNumber, journeyId),
    }
  }
  return {
    action: 'NEXT_DATE',
    url: ApprovedDatesUrls.enterNewDate(prisonerNumber, journeyId, datesBeingAdded[nextIndex].type),
  }
}

export { getApprovedDatePreviousDateUrl, getApprovedDatesNextAction }
