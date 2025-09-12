import {
  AdjustmentDto,
  AnalysedAdjustment,
} from '../../../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { remandDate } from '../../../../utils/nunjucksSetup'

export default interface AdjustmentTablesModel {
  remand: AdjustmentTable
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
  offenceDetailsByChargeId: Map<number, { offenceDescription: string; isRecall: boolean }>,
): AdjustmentTablesModel {
  const remand = dtos.filter(it => it.adjustmentType === 'REMAND')
  const taggedBail = dtos.filter(it => it.adjustmentType === 'TAGGED_BAIL')
  const totalDeductions = [...remand, ...taggedBail].reduce((total, next) => total + next.days, 0)
  return {
    remand: toTable(remand, dto => toRemandRow(dto, offenceDetailsByChargeId)),
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
  offenceDetailsByChargeId: Map<number, { offenceDescription: string; isRecall: boolean }>,
): AdjustmentCell[] {
  return [
    {
      text: `From ${remandDate(dto.fromDate, 'DD MMMM YYYY')} to ${remandDate(dto.toDate, 'DD MMMM YYYY')}`,
    },
    {
      html: (dto.remand?.chargeId?.map(charge => offenceDetailsByChargeId.get(charge)).filter(it => it) ?? [])
        .map(
          offence =>
            `${offence.offenceDescription}${offence.isRecall ? '<span class="moj-badge moj-badge--black">RECALL</span>' : ''}`,
        )
        .join('<br>'),
    },
    {
      text: `${dto.days}`,
    },
  ]
}
