import dayjs from 'dayjs'
import {
  AdjustmentDto,
  AdjustmentType,
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

const recallBadge = '<span class="moj-badge moj-badge--black govuk-!-margin-left-4">RECALL</span>'

export function adjustmentsTablesFromAdjustmentDTOs(
  dtos: AnalysedAdjustment[] | AdjustmentDto[],
  sentencesAndOffences: AnalysedSentenceAndOffence[] | SentenceAndOffenceWithReleaseArrangements[],
): AdjustmentTablesModel {
  const unusedDeductionsTracker: UnusedDeductionsTracker = {
    remainingUnallocated: activeAdjustmentsOfType('UNUSED_DEDUCTIONS', dtos).reduce(
      (total, next) => total + next.days,
      0,
    ),
  }
  const remand = toTable(
    activeAdjustmentsOfType('REMAND', dtos),
    dto => toRemandRow(dto, sentencesAndOffences),
    2,
    unusedDeductionsTracker,
  )
  const taggedBail = toTable(
    activeAdjustmentsOfType('TAGGED_BAIL', dtos),
    dto => toTaggedBailRow(dto, sentencesAndOffences),
    2,
    unusedDeductionsTracker,
  )
  const custodyAbroad = toTable(
    activeAdjustmentsOfType('CUSTODY_ABROAD', dtos),
    dto => toCustodyAbroadRow(dto, sentencesAndOffences),
    2,
  )
  const rada = toTable(
    activeAdjustmentsOfType('RESTORATION_OF_ADDITIONAL_DAYS_AWARDED', dtos),
    dto => toRADARow(dto),
    2,
  )
  const specialRemission = toTable(
    activeAdjustmentsOfType('SPECIAL_REMISSION', dtos),
    dto => toSpecialRemissionRow(dto),
    2,
  )
  const totalDeductions =
    (remand?.total ?? 0) +
    (taggedBail?.total ?? 0) +
    (custodyAbroad?.total ?? 0) +
    (rada?.total ?? 0) +
    (specialRemission?.total ?? 0)

  const ada = toTable(activeAdjustmentsOfType('ADDITIONAL_DAYS_AWARDED', dtos), dto => toAdaRow(dto), 2)
  const ual = toTable(activeAdjustmentsOfType('UNLAWFULLY_AT_LARGE', dtos), dto => toUALRow(dto), 3)
  const lal = toTable(activeAdjustmentsOfType('LAWFULLY_AT_LARGE', dtos), dto => toLALRow(dto), 3)
  const appealApplicant = toTable(
    activeAdjustmentsOfType('APPEAL_APPLICANT', dtos),
    dto => toAppealApplicantRow(dto, sentencesAndOffences),
    2,
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

function activeAdjustmentsOfType(type: AdjustmentType, dtos: AnalysedAdjustment[] | AdjustmentDto[]): AdjustmentDto[] {
  return dtos.filter(adjustment => adjustment.adjustmentType === type && adjustment.status === 'ACTIVE')
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
  totalsRow.push({
    text: `${totalDays}${unusedDeductionsAllocation > 0 ? ` including ${unusedDeductionsAllocation} days unused` : ''}`,
    classes: 'govuk-!-font-weight-bold',
  })
  for (let i = 2; i <= numberOfColumns; i += 1) {
    totalsRow.push({
      text: '',
    })
  }
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
  const anyRecallSentenceForAdjustment = findSentenceAndOffencesByChargeIdsOrSentenceSequence(
    dto.remand?.chargeId,
    dto.sentenceSequence,
    sentencesAndOffences,
  ).find(sentenceAndOffence => SentenceTypes.isRecall(sentenceAndOffence))
  return [
    {
      html: `${formatDate(dto.fromDate)} to ${formatDate(dto.toDate)}${anyRecallSentenceForAdjustment ? recallBadge : ''}`,
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
  const sentenceAndOffence = findSentenceAndOffenceBySentenceSequence(dto.sentenceSequence, sentencesAndOffences)
  return [
    {
      html: `Court case ${sentenceAndOffence.caseSequence}${SentenceTypes.isRecall(sentenceAndOffence) ? recallBadge : ''}`,
    },
    {
      text: `${dto.days}`,
    },
  ]
}

function findSentenceAndOffencesByChargeIdsOrSentenceSequence(
  chargeIds: number[] | undefined,
  sentenceSequence: number | undefined,
  sentencesAndOffences: AnalysedSentenceAndOffence[] | SentenceAndOffenceWithReleaseArrangements[],
) {
  if (chargeIds) {
    return (
      chargeIds?.map(chargeId => findSentenceAndOffenceByChargeId(chargeId, sentencesAndOffences)).filter(it => it) ??
      []
    )
  }
  if (sentenceSequence) {
    const found = findSentenceAndOffenceBySentenceSequence(sentenceSequence, sentencesAndOffences)
    if (found) return [found]
  }
  return []
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
  const anyRecallSentenceForAdjustment = findSentenceAndOffencesByChargeIdsOrSentenceSequence(
    dto.timeSpentInCustodyAbroad?.chargeIds,
    dto.sentenceSequence,
    sentencesAndOffences,
  ).find(sentenceAndOffence => SentenceTypes.isRecall(sentenceAndOffence))
  return [
    {
      html: `${documentType}${anyRecallSentenceForAdjustment ? recallBadge : ''}`,
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
      text: formatDate(dto.fromDate),
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
      text: `${formatDate(dto.fromDate)} to ${formatDate(dto.toDate)}`,
    },
    {
      text: `${dto.days}`,
    },
    {
      text: type,
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
      text: `${formatDate(dto.fromDate)} to ${formatDate(dto.toDate)}`,
    },
    {
      text: `${dto.days}${dto.lawfullyAtLarge?.affectsDates === 'NO' ? ' (excluded)' : ''}`,
    },
    {
      text: delayCaused,
    },
  ]
}

function toAppealApplicantRow(
  dto: AdjustmentDto,
  sentencesAndOffences: AnalysedSentenceAndOffence[] | SentenceAndOffenceWithReleaseArrangements[],
): AdjustmentCell[] {
  const anyRecallSentenceForAdjustment = findSentenceAndOffencesByChargeIdsOrSentenceSequence(
    dto.timeSpentAsAnAppealApplicant?.chargeIds,
    dto.sentenceSequence,
    sentencesAndOffences,
  ).find(sentenceAndOffence => SentenceTypes.isRecall(sentenceAndOffence))
  return [
    {
      html: `${dto.timeSpentAsAnAppealApplicant?.courtOfAppealReferenceNumber ?? 'Unknown'}${anyRecallSentenceForAdjustment ? recallBadge : ''}`,
    },
    {
      text: `${dto.days}`,
    },
  ]
}

function findSentenceAndOffenceByChargeId(
  chargeId: number,
  sentencesAndOffences: AnalysedSentenceAndOffence[] | SentenceAndOffenceWithReleaseArrangements[],
): AnalysedSentenceAndOffence | SentenceAndOffenceWithReleaseArrangements | null {
  return sentencesAndOffences.find(it => it.offence.offenderChargeId === chargeId)
}

function findSentenceAndOffenceBySentenceSequence(
  sentenceSequence: number,
  sentencesAndOffences: AnalysedSentenceAndOffence[] | SentenceAndOffenceWithReleaseArrangements[],
): AnalysedSentenceAndOffence | SentenceAndOffenceWithReleaseArrangements | null {
  if (!sentenceSequence) {
    return null
  }
  return sentencesAndOffences.find(it => it.sentenceSequence === sentenceSequence)
}

const formatDate = (date: string) => {
  if (!date) {
    return 'Date Not Entered'
  }
  return dayjs(date).format('DD/MM/YYYY')
}
