import { Readable } from 'stream'
import type HmppsAuthClient from '../data/hmppsAuthClient'
import PrisonApiClient from '../api/prisonApiClient'
import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiOffenderCalculatedKeyDates,
  PrisonApiOffenderFinePayment,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiReturnToCustodyDate,
  PrisonApiSentenceDetail,
  PrisonApiUserCaseloads,
} from '../@types/prisonApi/prisonClientTypes'
import PrisonerSearchApiClient from '../api/prisonerSearchApiClient'
import { Prisoner, PrisonerSearchCriteria } from '../@types/prisonerOffenderSearch/prisonerSearchClientTypes'
import { FullPageError } from '../types/FullPageError'

export default class PrisonerService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getPrisonerImage(username: string, nomsId: string): Promise<Readable> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    return new PrisonApiClient(token).getPrisonerImage(nomsId)
  }

  async getPrisonerDetailIncludingReleased(
    username: string,
    nomsId: string,
    userCaseloads: string[],
    token: string
  ): Promise<PrisonApiPrisoner> {
    return this.getPrisonerDetailImpl(nomsId, userCaseloads, token, true, false)
  }

  async getPrisonerDetail(
    username: string,
    nomsId: string,
    userCaseloads: string[],
    token: string
  ): Promise<PrisonApiPrisoner> {
    return this.getPrisonerDetailImpl(nomsId, userCaseloads, token, false, false)
  }

  async getPrisonerDetailForSpecialistSupport(
    username: string,
    nomsId: string,
    userCaseloads: string[],
    token: string
  ): Promise<PrisonApiPrisoner> {
    return this.getPrisonerDetailImpl(nomsId, userCaseloads, token, false, true)
  }

  private async getPrisonerDetailImpl(
    nomsId: string,
    userCaseloads: string[],
    token: string,
    includeReleased: boolean,
    isSpecialistSupport: boolean
  ): Promise<PrisonApiPrisoner> {
    try {
      const prisonerDetail = await new PrisonApiClient(token).getPrisonerDetail(nomsId)
      if (isSpecialistSupport) {
        return prisonerDetail
      }
      if (userCaseloads.includes(prisonerDetail.agencyId) || (includeReleased && prisonerDetail.agencyId === 'OUT')) {
        return prisonerDetail
      }
      throw FullPageError.notInCaseLoadError()
    } catch (error) {
      if (error?.status === 404) {
        throw FullPageError.notInCaseLoadError()
      } else {
        throw error
      }
    }
  }

  async searchPrisoners(username: string, prisonerSearchCriteria: PrisonerSearchCriteria): Promise<Prisoner[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    return new PrisonerSearchApiClient(token).searchPrisoners(prisonerSearchCriteria)
  }

  async searchPrisonerNumbers(username: string, prisonerNumbers: string[]): Promise<Prisoner[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    return new PrisonerSearchApiClient(token).searchPrisonerNumbers(prisonerNumbers)
  }

  async getActiveSentencesAndOffences(
    username: string,
    bookingId: number,
    token: string
  ): Promise<PrisonApiOffenderSentenceAndOffences[]> {
    const sentencesAndOffences = await new PrisonApiClient(token).getSentencesAndOffences(bookingId)
    if (sentencesAndOffences.length === 0) {
      throw FullPageError.noSentences()
    }
    return sentencesAndOffences.filter(s => s.sentenceStatus === 'A')
  }

  async getSentencesAndOffences(
    username: string,
    bookingId: number,
    token: string
  ): Promise<PrisonApiOffenderSentenceAndOffences[]> {
    const sentencesAndOffences = await new PrisonApiClient(token).getSentencesAndOffences(bookingId)
    if (sentencesAndOffences.length === 0) {
      throw FullPageError.noSentences()
    }
    return sentencesAndOffences
  }

  async getUsersCaseloads(username: string, token: string): Promise<PrisonApiUserCaseloads[]> {
    return new PrisonApiClient(token).getUsersCaseloads()
  }

  async getSentenceDetail(username: string, bookingId: number, token: string): Promise<PrisonApiSentenceDetail> {
    return new PrisonApiClient(token).getSentenceDetail(bookingId)
  }

  async getOffenderKeyDates(bookingId: number, token: string): Promise<PrisonApiOffenderCalculatedKeyDates> {
    return new PrisonApiClient(token).getOffenderKeyDates(bookingId)
  }

  async getBookingAndSentenceAdjustments(
    bookingId: number,
    token: string
  ): Promise<PrisonApiBookingAndSentenceAdjustments> {
    return new PrisonApiClient(token).getBookingAndSentenceAdjustments(bookingId)
  }

  async getReturnToCustodyDate(bookingId: number, token: string): Promise<PrisonApiReturnToCustodyDate> {
    const { returnToCustodyDate } = await new PrisonApiClient(token).getFixedTermRecallDetails(bookingId)
    return { bookingId, returnToCustodyDate } as PrisonApiReturnToCustodyDate
  }

  async getOffenderFinePayments(bookingId: number, token: string): Promise<PrisonApiOffenderFinePayment[]> {
    return new PrisonApiClient(token).getOffenderFinePayments(bookingId)
  }
}
