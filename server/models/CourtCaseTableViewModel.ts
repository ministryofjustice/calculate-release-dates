import SentenceRowViewModel from './SentenceRowViewModel'
import { AnalyzedSentenceAndOffences } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class CourtCaseTableViewModel {
  public sentences: SentenceRowViewModel[]

  public caseSequence: number

  public caseReference: string

  public courtDescription: string

  constructor(sentencesAndOffences: AnalyzedSentenceAndOffences[]) {
    this.caseSequence = sentencesAndOffences[0].caseSequence
    this.caseReference = sentencesAndOffences[0].caseReference
    this.courtDescription = sentencesAndOffences[0].courtDescription
    this.sentences = sentencesAndOffences
      .map(sentence => new SentenceRowViewModel(sentence))
      .sort((a, b) => a.sentencesAndOffence.lineSequence - b.sentencesAndOffence.lineSequence)
  }
}
