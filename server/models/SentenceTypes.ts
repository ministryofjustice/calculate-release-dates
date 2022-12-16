import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'

export default class SentenceTypes {
  private static sdsSentenceTypes = [
    'ADIMP',
    'ADIMP_ORA',
    'YOI',
    'YOI_ORA',
    'SEC91_03',
    'SEC91_03_ORA',
    'SEC250',
    'SEC250_ORA',
  ]

  private static fixedTermRecallTypes = [
    '14FTR_ORA',
    'FTR',
    'FTR_ORA',
    'FTR_SCH15',
    'FTRSCH15_ORA',
    'FTRSCH18',
    'FTRSCH18_ORA',
  ]

  private static edsSentenceTypes = ['EDS18', 'EDS21', 'EDSU18', 'LASPO_AR', 'LASPO_DR']

  private static sopcSentenceTypes = ['SEC236A', 'SOPC18', 'SOPC21', 'SDOPCU18']

  private static edsRecallSentenceTypes = ['LR_EDS18', 'LR_EDS21', 'LR_EDSU18', 'LR_LASPO_AR', 'LR_LASPO_DR']

  private static sopcRecallSentenceTypes = ['LR_SEC236A', 'LR_SOPC18', 'LR_SOPC21']

  private static aFineSentenceTypes = ['A/FINE']

  public static isSentenceSds(sentence: PrisonApiOffenderSentenceAndOffences): boolean {
    return this.sdsSentenceTypes.includes(sentence.sentenceCalculationType)
  }

  public static isSentenceFixedTermRecall(sentence: PrisonApiOffenderSentenceAndOffences): boolean {
    return this.fixedTermRecallTypes.includes(sentence.sentenceCalculationType)
  }

  public static isSentenceSopc(sentence: PrisonApiOffenderSentenceAndOffences): boolean {
    return this.sopcSentenceTypes.includes(sentence.sentenceCalculationType)
  }

  public static isSentenceEds(sentence: PrisonApiOffenderSentenceAndOffences): boolean {
    return this.edsSentenceTypes.includes(sentence.sentenceCalculationType)
  }

  public static isSentenceAfine(sentence: PrisonApiOffenderSentenceAndOffences): boolean {
    return this.aFineSentenceTypes.includes(sentence.sentenceCalculationType)
  }

  public static isSentenceSopcRecall(sentence: PrisonApiOffenderSentenceAndOffences): boolean {
    return this.sopcRecallSentenceTypes.includes(sentence.sentenceCalculationType)
  }

  public static isSentenceEdsRecall(sentence: PrisonApiOffenderSentenceAndOffences): boolean {
    return this.edsRecallSentenceTypes.includes(sentence.sentenceCalculationType)
  }
}
