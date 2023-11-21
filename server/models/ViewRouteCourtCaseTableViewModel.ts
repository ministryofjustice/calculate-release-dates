import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import ViewRouteSentenceRowViewModel from './ViewRouteSentenceRowViewModel'

export default class ViewRouteCourtCaseTableViewModel {
  public sentences: ViewRouteSentenceRowViewModel[]

  public caseSequence: number

  public caseReference: string

  public courtDescription: string

  constructor(sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]) {
    this.caseSequence = sentencesAndOffences[0].caseSequence
    this.caseReference = sentencesAndOffences[0].caseReference
    this.courtDescription = sentencesAndOffences[0].courtDescription
    this.sentences = sentencesAndOffences
      .map(sentence => new ViewRouteSentenceRowViewModel(sentence))
      .sort((a, b) => a.sentencesAndOffence.lineSequence - b.sentencesAndOffence.lineSequence)
  }
}
