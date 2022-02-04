type AggregatedAdjustments = {
  /** Number of additional days awarded */
  additionalDaysAwarded?: number
  /** Number of lawfully at large days */
  lawfullyAtLarge?: number
  /** Number of recall sentence remand days */
  recallSentenceRemand?: number
  /** Number of recall sentence tagged bail days */
  recallSentenceTaggedBail?: number
  /** Number of remand days */
  remand?: number
  /** Number of restored additional days awarded */
  restoredAdditionalDaysAwarded?: number
  /** Number of special remission days */
  specialRemission?: number
  /** Number of tagged bail days */
  taggedBail?: number
  /** Number unlawfully at large days */
  unlawfullyAtLarge?: number
  /** Number of unused remand days */
  unusedRemand?: number
}

export default AggregatedAdjustments
