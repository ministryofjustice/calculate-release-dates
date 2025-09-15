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
  custodyAbroad: AdjustmentTable
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

interface UnusedDeductionsTracker {
  remainingUnallocated: number
}

export function adjustmentsTablesFromAdjustmentDTOs(
  dtos: AnalysedAdjustment[] | AdjustmentDto[],
  sentencesAndOffences: AnalysedSentenceAndOffence[] | SentenceAndOffenceWithReleaseArrangements[],
): AdjustmentTablesModel {
  const remand = dtos.filter(it => it.adjustmentType === 'REMAND')
  const taggedBail = dtos.filter(it => it.adjustmentType === 'TAGGED_BAIL')
  const custodyAbroad = dtos.filter(it => it.adjustmentType === 'CUSTODY_ABROAD')
  const unusedDeductionsTracker: UnusedDeductionsTracker = {
    remainingUnallocated: dtos
      .filter(it => it.adjustmentType === 'UNUSED_DEDUCTIONS')
      .reduce((total, next) => total + next.days, 0),
  }
  const totalDeductions = [...remand, ...taggedBail, ...custodyAbroad].reduce((total, next) => total + next.days, 0)
  return {
    remand: toTable(remand, dto => toRemandRow(dto, sentencesAndOffences), unusedDeductionsTracker),
    taggedBail: toTable(taggedBail, dto => toTaggedBailRow(dto, sentencesAndOffences), unusedDeductionsTracker),
    custodyAbroad: toTable(custodyAbroad, dto => toCustodyAbroadRow(dto, sentencesAndOffences)),
    totalDeductions,
  }
}

function toTable(
  dtos: AdjustmentDto[],
  cellFn: (dto: AdjustmentDto) => AdjustmentCell[],
  unusedDeductionsTracker?: UnusedDeductionsTracker,
): AdjustmentTable {
  const tracker = unusedDeductionsTracker
  const totalDays = dtos.reduce((total, next) => total + next.days, 0)
  let unusedDeductionsAllocation = null
  if (tracker && tracker.remainingUnallocated > 0) {
    unusedDeductionsAllocation = Math.min(totalDays, tracker.remainingUnallocated)
    tracker.remainingUnallocated = Math.max(0, tracker.remainingUnallocated - unusedDeductionsAllocation)
  }
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
      text: `${totalDays}${unusedDeductionsAllocation > 0 ? ` including ${unusedDeductionsAllocation} days of unused` : ''}`,
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

function toCustodyAbroadRow(
  dto: AdjustmentDto,
  sentencesAndOffences: AnalysedSentenceAndOffence[] | SentenceAndOffenceWithReleaseArrangements[],
): AdjustmentCell[] {
  let documentType = 'Unknown'
  if (dto.timeSpentInCustodyAbroad?.documentationSource === 'COURT_WARRANT') {
    documentType = 'Sentencing warrant'
  } else if (dto.timeSpentInCustodyAbroad?.documentationSource === 'PPCS_LETTER') {
    documentType = 'Letter from PPCS'
  }
  return [
    {
      text: documentType,
    },
    {
      html: (
        dto.timeSpentInCustodyAbroad?.chargeIds
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
