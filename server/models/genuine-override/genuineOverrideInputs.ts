export interface GenuineOverrideInputs {
  dates?: GenuineOverrideDate[]
  reason?: string
  reasonFurtherDetail?: string
}

export interface GenuineOverrideDate {
  type: string
  date: string
}
