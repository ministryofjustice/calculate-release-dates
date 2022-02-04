import { Readable } from 'stream'
import type HmppsAuthClient from '../api/hmppsAuthClient'
import PrisonApiClient from '../api/prisonApiClient'
import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
  PrisonApiUserCaseloads,
} from '../@types/prisonApi/prisonClientTypes'
import PrisonerSearchApiClient from '../api/prisonerSearchApiClient'
import { Prisoner, PrisonerSearchCriteria } from '../@types/prisonerOffenderSearch/prisonerSearchClientTypes'
import { FullPageError } from '../types/FullPageError'
import AggregatedAdjustments from '../@types/calculateReleaseDates/AggregatedAdjustments'

export default class PrisonerService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getPrisonerImage(username: string, nomsId: string): Promise<Readable> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    return new PrisonApiClient(token).getPrisonerImage(nomsId)
  }

  async getPrisonerDetail(
    username: string,
    nomsId: string,
    userCaseloads: string[],
    token: string
  ): Promise<PrisonApiPrisoner> {
    try {
      const prisonerDetail = await new PrisonApiClient(token).getPrisonerDetail(nomsId)
      if (!userCaseloads.includes(prisonerDetail.agencyId)) {
        throw FullPageError.notInCaseLoadError()
      }
      return prisonerDetail
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

  async getSentencesAndOffences(
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

  async getUsersCaseloads(username: string, token: string): Promise<PrisonApiUserCaseloads[]> {
    return new PrisonApiClient(token).getUsersCaseloads()
  }

  async getSentenceDetail(username: string, bookingId: number, token: string): Promise<PrisonApiSentenceDetail> {
    return new PrisonApiClient(token).getSentenceDetail(bookingId)
  }

  async getBookingAndSentenceAdjustments(
    bookingId: number,
    token: string
  ): Promise<PrisonApiBookingAndSentenceAdjustments> {
    return new PrisonApiClient(token).getBookingAndSentenceAdjustments(bookingId)
  }

  async getAggregatedBookingAndSentenceAdjustments(bookingId: number, token: string): Promise<AggregatedAdjustments> {
    const adjustments = await this.getBookingAndSentenceAdjustments(bookingId, token)
    return {
      additionalDaysAwarded: this.aggregateAdjustments(
        adjustments.bookingAdjustments.filter(a => a.type === 'ADDITIONAL_DAYS_AWARDED')
      ),
      remand: this.aggregateAdjustments(adjustments.sentenceAdjustments.filter(a => a.type === 'REMAND')),
      restoredAdditionalDaysAwarded: this.aggregateAdjustments(
        adjustments.bookingAdjustments.filter(a => a.type === 'RESTORED_ADDITIONAL_DAYS_AWARDED')
      ),
      taggedBail: this.aggregateAdjustments(adjustments.sentenceAdjustments.filter(a => a.type === 'TAGGED_BAIL')),
      unlawfullyAtLarge: this.aggregateAdjustments(
        adjustments.bookingAdjustments.filter(a => a.type === 'UNLAWFULLY_AT_LARGE')
      ),
    }
  }

  private aggregateAdjustments(adjustments: { numberOfDays?: number; active?: boolean }[]): number {
    return adjustments
      .filter(a => a.active)
      .map(a => a.numberOfDays)
      .reduce((sum, current) => sum + current, 0)
  }
}
