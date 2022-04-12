import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/PrisonApiOffenderSentenceAndOffences'
import SentenceRowViewModel from './SentenceRowViewModel'

export default class CourtCaseTableViewModel {
  public sentences: SentenceRowViewModel[]

  public caseSequence: number

  public caseReference: string

  public courtDescription: string

  constructor(sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]) {
    this.caseSequence = sentencesAndOffences[0].caseSequence
    this.caseReference = sentencesAndOffences[0].caseReference
    this.courtDescription = sentencesAndOffences[0].courtDescription
    this.sentences = sentencesAndOffences
      .map(sentence => new SentenceRowViewModel(sentence))
      .sort((a, b) => a.sentencesAndOffence.lineSequence - b.sentencesAndOffence.lineSequence)
  }
}
