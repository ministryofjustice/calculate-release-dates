import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'

export default class SentenceTypes {
  private static fixedTermRecallTypes = ['14FTR_ORA', '14FTRHDC_ORA', 'FTR', 'FTR_ORA']

  private static edsSentenceTypes = ['EDS18', 'EDS21', 'EDSU18', 'LASPO_AR', 'LASPO_DR']

  private static sopcSentenceTypes = ['SEC236A', 'SOPC18', 'SOPC21', 'SDOPCU18']

  private static aFineSentenceTypes = ['A/FINE']

  public static isSentenceFixedTermRecall(sentence: PrisonApiOffenderSentenceAndOffences): boolean {
    return this.fixedTermRecallTypes.includes(sentence.sentenceCalculationType)
  }

  public static isSentenceSopc(sentence: PrisonApiOffenderSentenceAndOffences): boolean {
    return this.sopcSentenceTypes.includes(sentence.sentenceCalculationType)
  }

  public static isSentenceEds(sentence: PrisonApiOffenderSentenceAndOffences): boolean {
    return this.edsSentenceTypes.includes(sentence.sentenceCalculationType)
  }

  public static isAfineSentence(sentence: PrisonApiOffenderSentenceAndOffences): boolean {
    return this.aFineSentenceTypes.includes(sentence.sentenceCalculationType)
  }
}
