import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/PrisonApiOffenderSentenceAndOffences'
import { PrisonApiSentenceTerms } from '../@types/prisonApi/PrisonApiSentenceTerms'

// TODO remove when we get rid of the old sentenceTable design.
type AggregatedTerm = {
  years: number
  months: number
  weeks: number
  days: number
}

export default class SentenceRowViewModel {
  private static fixedTermRecallTypes = ['14FTR_ORA', '14FTRHDC_ORA', 'FTR', 'FTR_ORA']

  private static edsSentenceTypes = ['EDS18', 'EDS21', 'EDSU18', 'LASPO_AR', 'LASPO_DR']

  private static sopcSentenceTypes = ['SEC236A', 'SOPC18', 'SOPC21', 'SDOPCU18']

  // TODO remove when we get rid of the old sentenceTable design.
  private allTerms: AggregatedTerm

  private imprisonmentTerm: PrisonApiSentenceTerms[]

  private licenceTerm: PrisonApiSentenceTerms[]

  constructor(public sentencesAndOffence: PrisonApiOffenderSentenceAndOffences) {
    this.allTerms = this.aggregateTerms(sentencesAndOffence.terms)
    this.imprisonmentTerm = sentencesAndOffence.terms.filter(term => term.code === 'IMP')
    this.licenceTerm = sentencesAndOffence.terms.filter(term => term.code === 'LIC')
  }

  // TODO remove when we get rid of the old sentenceTable design.
  private aggregateTerms(terms: PrisonApiSentenceTerms[]): AggregatedTerm {
    return {
      years: terms.map(t => t.years).reduce((sum, current) => sum + current, 0) || 0,
      months: terms.map(t => t.months).reduce((sum, current) => sum + current, 0) || 0,
      weeks: terms.map(t => t.weeks).reduce((sum, current) => sum + current, 0) || 0,
      days: terms.map(t => t.days).reduce((sum, current) => sum + current, 0) || 0,
    }
  }

  public isFixedTermRecall(): boolean {
    return SentenceRowViewModel.isSentenceFixedTermRecall(this.sentencesAndOffence)
  }

  public isEds(): boolean {
    return SentenceRowViewModel.isSentenceEds(this.sentencesAndOffence)
  }

  public isSopc(): boolean {
    return SentenceRowViewModel.isSentenceSopc(this.sentencesAndOffence)
  }

  public hasCustodialAndLicenseTerms(): boolean {
    return this.isEds() || this.isSopc()
  }

  public static isSentenceFixedTermRecall(sentence: PrisonApiOffenderSentenceAndOffences): boolean {
    return this.fixedTermRecallTypes.includes(sentence.sentenceCalculationType)
  }

  public static isSentenceSopc(sentence: PrisonApiOffenderSentenceAndOffences): boolean {
    return SentenceRowViewModel.sopcSentenceTypes.includes(sentence.sentenceCalculationType)
  }

  public static isSentenceEds(sentence: PrisonApiOffenderSentenceAndOffences): boolean {
    return SentenceRowViewModel.edsSentenceTypes.includes(sentence.sentenceCalculationType)
  }
}
