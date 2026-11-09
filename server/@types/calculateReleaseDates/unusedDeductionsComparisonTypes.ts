import { ValidationMessage } from './calculateReleaseDatesClientTypes'

export type UnusedDeductionsComparisonStatus = 'SETUP' | 'PROCESSING' | 'COMPLETED' | 'ERROR'
export type UnusedDeductionsComparisonType = 'MANUAL' | 'PRISON' | 'ALL_PRISONS'
export type UnusedDeductionsComparisonOutcome = 'MATCH' | 'MISMATCH' | 'VALIDATION_ERROR' | 'FATAL_ERROR'

export type UnusedDeductionsComparisonInput = {
  prison?: string
  prisonerIds?: string[]
}

export interface UnusedDeductionsComparisonSummary {
  comparisonShortReference: string
  prison?: string
  comparisonType: UnusedDeductionsComparisonType
  comparisonStatus: UnusedDeductionsComparisonStatus
  calculatedAt: string
  calculatedByUsername: string
  numberOfMismatches: number
  numberOfValidationErrors: number
  numberOfPeopleExpected: number
  numberOfPeopleCompared: number
  numberOfPeopleComparisonFailedFor: number
  comparisonProgress: { percentageComplete: number; expectedCompletionTime?: string }
}

export interface UnusedDeductionsComparisonPersonSummary {
  personShortReference: string
  person: string
  lastName?: string
  establishment?: string
  outcome: UnusedDeductionsComparisonOutcome
  existingUnusedDeductions?: number
  calculatedUnusedDeductions?: number | null
  custodialDays?: number | null
  totalDeductions?: number | null
}

export type UnusedDeductionsComparisonPageInfo = {
  number: number
  size: number
  totalElements: number
  totalPages: number
}

export type UnusedDeductionsComparisonOverviewOptions = {
  outcome?: string
  prisonerId?: string
  page?: number
  size?: number
}

export interface UnusedDeductionsComparisonOverview {
  comparison: UnusedDeductionsComparisonSummary
  criteria: Record<string, unknown>
  people: UnusedDeductionsComparisonPersonSummary[]
  page: UnusedDeductionsComparisonPageInfo
}

export interface UnusedDeductionsComparisonAdjustment {
  id?: string
  adjustmentType: string
  source?: string
  fromDate?: string | null
  toDate?: string | null
  days?: number | null
  effectiveDays?: number | null
}

export interface UnusedDeductionsComparisonPersonDetail {
  comparison: UnusedDeductionsComparisonSummary
  person: UnusedDeductionsComparisonPersonSummary
  adjustments: UnusedDeductionsComparisonAdjustment[]
  validationMessages: ValidationMessage[]
  fatalException?: string | null
  calculatedAt?: string
}

export interface UnusedDeductionsComparisonPage {
  content: UnusedDeductionsComparisonSummary[]
  page: UnusedDeductionsComparisonPageInfo
}
