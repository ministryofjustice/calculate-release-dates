import {
  AdjustmentDto,
  AnalysedAdjustment,
  AnalysedSentenceAndOffence,
  SentenceAndOffenceWithReleaseArrangements,
} from '../../../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { remandDate } from '../../../../utils/nunjucksSetup'
import SentenceTypes from '../../../../models/SentenceTypes'

export default interface AdjustmentTablesModel {
  remand: AdjustmentTable
  taggedBail: AdjustmentTable
  totalDeductions: number
}

interface AdjustmentTable {
  rows: AdjustmentCell[][]
  total: number
}

interface AdjustmentCell {
  text?: string
  html?: string
  classes?: string
}

export function adjustmentsTablesFromAdjustmentDTOs(
  dtos: AnalysedAdjustment[] | AdjustmentDto[],
  sentencesAndOffences: AnalysedSentenceAndOffence[] | SentenceAndOffenceWithReleaseArrangements[],
): AdjustmentTablesModel {
  const remand = dtos.filter(it => it.adjustmentType === 'REMAND')
  const taggedBail = dtos.filter(it => it.adjustmentType === 'TAGGED_BAIL')
  const totalDeductions = [...remand, ...taggedBail].reduce((total, next) => total + next.days, 0)

  return {
    remand: toTable(remand, dto => toRemandRow(dto, sentencesAndOffences)),
    taggedBail: toTable(taggedBail, dto => toTaggedBailRow(dto, sentencesAndOffences)),
    totalDeductions,
  }
}

function toTable(dtos: AdjustmentDto[], cellFn: (dto: AdjustmentDto) => AdjustmentCell[]): AdjustmentTable {
  const totalDays = dtos.reduce((total, next) => total + next.days, 0)
  const rows = dtos.map(cellFn)
  rows.push([
    {
      text: 'Total days',
      classes: 'govuk-!-font-weight-bold',
    },
    {
      text: '',
    },
    {
      text: `${totalDays}`,
      classes: 'govuk-!-font-weight-bold',
    },
  ])
  return {
    rows,
    total: totalDays,
  }
}

function toRemandRow(
  dto: AdjustmentDto,
  sentencesAndOffences: AnalysedSentenceAndOffence[] | SentenceAndOffenceWithReleaseArrangements[],
): AdjustmentCell[] {
  return [
    {
      text: `From ${remandDate(dto.fromDate, 'DD MMMM YYYY')} to ${remandDate(dto.toDate, 'DD MMMM YYYY')}`,
    },
    {
      html: (
        dto.remand?.chargeId
          ?.map(chargeId => findOffenceDetailsByChargeId(chargeId, sentencesAndOffences))
          .filter(it => it) ?? []
      )
        .map(
          sentenceAndOffence =>
            `${sentenceAndOffence.offence.offenceDescription}${SentenceTypes.isRecall(sentenceAndOffence) ? '<span class="moj-badge moj-badge--black">RECALL</span>' : ''}`,
        )
        .join('<br>'),
    },
    {
      text: `${dto.days}`,
    },
  ]
}

function toTaggedBailRow(
  dto: AdjustmentDto,
  sentencesAndOffences: AnalysedSentenceAndOffence[] | SentenceAndOffenceWithReleaseArrangements[],
): AdjustmentCell[] {
  const sentenceAndOffence = findSentenceAndOffenceBySentenceSeqAndCaseSeq(
    dto.sentenceSequence,
    dto.taggedBail?.caseSequence,
    sentencesAndOffences,
  )
  return [
    {
      html: `Court case ${sentenceAndOffence.caseSequence}${SentenceTypes.isRecall(sentenceAndOffence) ? '<span class="moj-badge moj-badge--black">RECALL</span>' : ''}`,
    },
    {
      text: sentenceAndOffence?.caseReference ?? 'Unknown',
    },
    {
      text: `${dto.days}`,
    },
  ]
}

function findOffenceDetailsByChargeId(
  chargeId: number,
  sentencesAndOffences: AnalysedSentenceAndOffence[] | SentenceAndOffenceWithReleaseArrangements[],
): AnalysedSentenceAndOffence | SentenceAndOffenceWithReleaseArrangements | null {
  return sentencesAndOffences.find(it => it.offence.offenderChargeId === chargeId)
}

function findSentenceAndOffenceBySentenceSeqAndCaseSeq(
  sentenceSequence: number,
  caseSequence: number,
  sentencesAndOffences: AnalysedSentenceAndOffence[] | SentenceAndOffenceWithReleaseArrangements[],
): AnalysedSentenceAndOffence | SentenceAndOffenceWithReleaseArrangements | null {
  if (!sentenceSequence || !caseSequence) {
    return null
  }
  return sentencesAndOffences.find(it => it.sentenceSequence === sentenceSequence && it.caseSequence === caseSequence)
}
