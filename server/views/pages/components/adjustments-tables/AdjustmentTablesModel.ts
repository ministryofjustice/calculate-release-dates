import dayjs from 'dayjs'
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
  rada: AdjustmentTable
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
  const rada = dtos.filter(it => it.adjustmentType === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED')
  const unusedDeductionsTracker: UnusedDeductionsTracker = {
    remainingUnallocated: dtos
      .filter(it => it.adjustmentType === 'UNUSED_DEDUCTIONS')
      .reduce((total, next) => total + next.days, 0),
  }
  const totalDeductions = [...remand, ...taggedBail, ...custodyAbroad, ...rada].reduce(
    (total, next) => total + next.days,
    0,
  )
  return {
    remand: toTable(remand, dto => toRemandRow(dto, sentencesAndOffences), 3, unusedDeductionsTracker),
    taggedBail: toTable(taggedBail, dto => toTaggedBailRow(dto, sentencesAndOffences), 3, unusedDeductionsTracker),
    custodyAbroad: toTable(custodyAbroad, dto => toCustodyAbroadRow(dto, sentencesAndOffences), 3),
    rada: toTable(rada, dto => toRADARow(dto), 2),
    totalDeductions,
  }
}

function toTable(
  dtos: AdjustmentDto[],
  cellFn: (dto: AdjustmentDto) => AdjustmentCell[],
  numberOfColumns: number,
  unusedDeductionsTracker?: UnusedDeductionsTracker,
): AdjustmentTable {
  if (dtos.length === 0) {
    return {
      rows: [],
      total: 0,
    }
  }
  const tracker = unusedDeductionsTracker
  const totalDays = dtos.reduce((total, next) => total + next.days, 0)
  let unusedDeductionsAllocation = null
  if (tracker && tracker.remainingUnallocated > 0) {
    unusedDeductionsAllocation = Math.min(totalDays, tracker.remainingUnallocated)
    tracker.remainingUnallocated = Math.max(0, tracker.remainingUnallocated - unusedDeductionsAllocation)
  }
  const rows = dtos.map(cellFn)
  const totalsRow = []
  totalsRow.push({
    text: 'Total days',
    classes: 'govuk-!-font-weight-bold',
  })
  for (let i = 2; i < numberOfColumns; i += 1) {
    totalsRow.push({
      text: '',
    })
  }
  totalsRow.push({
    text: `${totalDays}${unusedDeductionsAllocation > 0 ? ` including ${unusedDeductionsAllocation} days of unused` : ''}`,
    classes: 'govuk-!-font-weight-bold',
  })
  rows.push(totalsRow)
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

function toRADARow(dto: AdjustmentDto): AdjustmentCell[] {
  return [
    {
      text: dayjs(dto.fromDate).format('DD MMMM YYYY'),
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
