import {
  AnalysedSentenceAndOffence,
  OffenderOffence,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class SentenceHelper {
  public constructor(public sentencesAndOffences: AnalysedSentenceAndOffence[]) {}

  public rowIsSdsPlus(sentence: AnalysedSentenceAndOffence, _: OffenderOffence): boolean {
    return sentence.isSDSPlus
  }
}
