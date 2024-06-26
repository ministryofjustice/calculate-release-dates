import { PrisonApiOffenderSentenceTerm } from '../@types/prisonApi/prisonClientTypes'
import SentenceTypes from './SentenceTypes'
import { AnalysedSentenceAndOffence } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

// TODO remove when we get rid of the old sentenceTable design.
type AggregatedTerm = {
  years: number
  months: number
  weeks: number
  days: number
}

export default class SentenceRowViewModel {
  // TODO remove when we get rid of the old sentenceTable design.
  private allTerms: AggregatedTerm

  private imprisonmentTerm: PrisonApiOffenderSentenceTerm[]

  private licenceTerm: PrisonApiOffenderSentenceTerm[]

  constructor(public sentencesAndOffence: AnalysedSentenceAndOffence) {
    this.imprisonmentTerm = sentencesAndOffence.terms.filter(term => term.code === 'IMP')
    this.licenceTerm = sentencesAndOffence.terms.filter(term => term.code === 'LIC')
  }

  public isFixedTermRecall(): boolean {
    return SentenceTypes.isSentenceFixedTermRecall(this.sentencesAndOffence)
  }

  public isEds(): boolean {
    return SentenceTypes.isSentenceEds(this.sentencesAndOffence)
  }

  public isSopc(): boolean {
    return SentenceTypes.isSentenceSopc(this.sentencesAndOffence)
  }

  public isEdsRecall(): boolean {
    return SentenceTypes.isSentenceEdsRecall(this.sentencesAndOffence)
  }

  public isSopcRecall(): boolean {
    return SentenceTypes.isSentenceSopcRecall(this.sentencesAndOffence)
  }

  public isAfine(): boolean {
    return SentenceTypes.isSentenceAfine(this.sentencesAndOffence)
  }

  public hasCustodialAndLicenseTerms(): boolean {
    return this.isEds() || this.isSopc() || this.isEdsRecall() || this.isSopcRecall()
  }
}
