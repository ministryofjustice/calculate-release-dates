import dayjs from 'dayjs'
import {
  AdjustmentDto,
  AnalysedAdjustment,
  AnalysedSentenceAndOffence,
  SentenceAndOffenceWithReleaseArrangements,
} from '../../../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import SentenceTypes from '../../../../models/SentenceTypes'

export default interface AdjustmentTablesModel {
  remand?: AdjustmentTable
  taggedBail?: AdjustmentTable
  custodyAbroad?: AdjustmentTable
  rada?: AdjustmentTable
  specialRemission?: AdjustmentTable
  totalDeductions: number
  ada?: AdjustmentTable
  ual?: AdjustmentTable
  lal?: AdjustmentTable
  appealApplicant?: AdjustmentTable
  totalAdditions: number
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
  const unusedDeductionsTracker: UnusedDeductionsTracker = {
    remainingUnallocated: dtos
      .filter(it => it.adjustmentType === 'UNUSED_DEDUCTIONS')
      .reduce((total, next) => total + next.days, 0),
  }
  const remand = toTable(
    dtos.filter(it => it.adjustmentType === 'REMAND'),
    dto => toRemandRow(dto, sentencesAndOffences),
    3,
    unusedDeductionsTracker,
  )
  const taggedBail = toTable(
    dtos.filter(it => it.adjustmentType === 'TAGGED_BAIL'),
    dto => toTaggedBailRow(dto, sentencesAndOffences),
    3,
    unusedDeductionsTracker,
  )
  const custodyAbroad = toTable(
    dtos.filter(it => it.adjustmentType === 'CUSTODY_ABROAD'),
    dto => toCustodyAbroadRow(dto, sentencesAndOffences),
    3,
  )
  const rada = toTable(
    dtos.filter(it => it.adjustmentType === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED'),
    dto => toRADARow(dto),
    2,
  )
  const specialRemission = toTable(
    dtos.filter(it => it.adjustmentType === 'SPECIAL_REMISSION'),
    dto => toSpecialRemissionRow(dto),
    2,
  )
  const totalDeductions =
    (remand?.total ?? 0) +
    (taggedBail?.total ?? 0) +
    (custodyAbroad?.total ?? 0) +
    (rada?.total ?? 0) +
    (specialRemission?.total ?? 0)

  const ada = toTable(
    dtos.filter(it => it.adjustmentType === 'ADDITIONAL_DAYS_AWARDED'),
    dto => toAdaRow(dto),
    2,
  )
  const ual = toTable(
    dtos.filter(it => it.adjustmentType === 'UNLAWFULLY_AT_LARGE'),
    dto => toUALRow(dto),
    3,
  )
  const lal = toTable(
    dtos.filter(it => it.adjustmentType === 'LAWFULLY_AT_LARGE'),
    dto => toLALRow(dto),
    3,
  )
  const appealApplicant = toTable(
    dtos.filter(it => it.adjustmentType === 'APPEAL_APPLICANT'),
    dto => toAppealApplicantRow(dto, sentencesAndOffences),
    3,
  )

  const totalAdditions = (ada?.total ?? 0) + (ual?.total ?? 0) + (lal?.total ?? 0) + (appealApplicant?.total ?? 0)
  return {
    remand,
    taggedBail,
    custodyAbroad,
    rada,
    specialRemission,
    totalDeductions,
    ada,
    ual,
    lal,
    appealApplicant,
    totalAdditions,
  }
}

function toTable(
  dtos: AdjustmentDto[],
  cellFn: (dto: AdjustmentDto) => AdjustmentCell[],
  numberOfColumns: number,
  unusedDeductionsTracker?: UnusedDeductionsTracker,
): AdjustmentTable | null {
  if (!dtos || dtos.length === 0) {
    return null
  }
  const tracker = unusedDeductionsTracker
  const totalDays = dtos.reduce((total, next) => {
    let addition = 0
    if (next.adjustmentType !== 'LAWFULLY_AT_LARGE' || next.lawfullyAtLarge?.affectsDates === 'YES') {
      addition = next.days
    }
    return total + addition
  }, 0)
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
      text: `From ${formatDate(dto.fromDate)} to ${formatDate(dto.toDate)}`,
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
    documentType = 'Sentencing warrant from the court'
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
      text: formatDate(dto.fromDate),
    },
    {
      text: `${dto.days}`,
    },
  ]
}

function toSpecialRemissionRow(dto: AdjustmentDto): AdjustmentCell[] {
  let documentType = 'Unknown'
  if (dto.specialRemission?.type === 'MERITORIOUS_CONDUCT') {
    documentType = 'Meritorious (excellent) conduct'
  } else if (dto.specialRemission?.type === 'RELEASE_IN_ERROR') {
    documentType = 'Release in error'
  } else if (dto.specialRemission?.type === 'RELEASE_DATE_CALCULATED_TOO_EARLY') {
    documentType = 'Release date calculated too early'
  }
  return [
    {
      text: documentType,
    },
    {
      text: `${dto.days}`,
    },
  ]
}

function toAdaRow(dto: AdjustmentDto): AdjustmentCell[] {
  return [
    {
      text: `Awarded ${dayjs(dto.fromDate).format('DD MMMM YYYY')}`,
    },
    {
      text: `${dto.days}`,
    },
  ]
}

function toUALRow(dto: AdjustmentDto): AdjustmentCell[] {
  let type = 'Unknown'
  if (dto.unlawfullyAtLarge?.type === 'RECALL') {
    type = 'Recall'
  } else if (dto.unlawfullyAtLarge?.type === 'ESCAPE') {
    type = 'Escape, including absconds and ROTL failures'
  } else if (dto.unlawfullyAtLarge?.type === 'SENTENCED_IN_ABSENCE') {
    type = 'Sentenced in absence'
  } else if (dto.unlawfullyAtLarge?.type === 'RELEASE_IN_ERROR') {
    type = 'Release in error'
  } else if (dto.unlawfullyAtLarge?.type === 'IMMIGRATION_DETENTION') {
    type = 'Immigration detention'
  }
  return [
    {
      text: `From ${formatDate(dto.fromDate)} to ${formatDate(dto.toDate)}`,
    },
    {
      text: type,
    },
    {
      text: `${dto.days}`,
    },
  ]
}

function toLALRow(dto: AdjustmentDto): AdjustmentCell[] {
  let delayCaused = 'Unknown'
  if (dto.lawfullyAtLarge?.affectsDates === 'YES') {
    delayCaused = 'Yes'
  } else if (dto.lawfullyAtLarge?.affectsDates === 'NO') {
    delayCaused = 'No'
  }
  return [
    {
      text: `From ${formatDate(dto.fromDate)} to ${formatDate(dto.toDate)}`,
    },
    {
      text: delayCaused,
    },
    {
      text: `${dto.days}${dto.lawfullyAtLarge?.affectsDates === 'NO' ? ' (excluded)' : ''}`,
    },
  ]
}

function toAppealApplicantRow(
  dto: AdjustmentDto,
  sentencesAndOffences: AnalysedSentenceAndOffence[] | SentenceAndOffenceWithReleaseArrangements[],
): AdjustmentCell[] {
  return [
    {
      text: dto.timeSpentAsAnAppealApplicant?.courtOfAppealReferenceNumber ?? 'Unknown',
    },
    {
      html: (
        dto.timeSpentAsAnAppealApplicant?.chargeIds
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

const formatDate = (date: string) => {
  if (!date) {
    return 'Date Not Entered'
  }
  return dayjs(date).format('DD MMMM YYYY')
}
