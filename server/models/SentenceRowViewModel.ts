import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/PrisonApiOffenderSentenceAndOffences'

export default class SentenceRowViewModel {
  public years: number

  public months: number

  public weeks: number

  public days: number

  private static fixedTermRecallTypes = ['14FTR_ORA', '14FTRHDC_ORA', 'FTR', 'FTR_ORA']

  constructor(public sentencesAndOffence: PrisonApiOffenderSentenceAndOffences) {
    this.years = sentencesAndOffence.terms.map(t => t.years).reduce((sum, current) => sum + current, 0) || 0
    this.months = sentencesAndOffence.terms.map(t => t.months).reduce((sum, current) => sum + current, 0) || 0
    this.weeks = sentencesAndOffence.terms.map(t => t.weeks).reduce((sum, current) => sum + current, 0) || 0
    this.days = sentencesAndOffence.terms.map(t => t.days).reduce((sum, current) => sum + current, 0) || 0
  }

  public isFixedTermRecall(): boolean {
    return SentenceRowViewModel.isSentenceFixedTermRecall(this.sentencesAndOffence)
  }

  public static isSentenceFixedTermRecall(sentence: PrisonApiOffenderSentenceAndOffences): boolean {
    return this.fixedTermRecallTypes.includes(sentence.sentenceCalculationType)
  }
}
