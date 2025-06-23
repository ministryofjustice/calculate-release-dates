## Validation Layers in CRDS

This page outlines the typical validation layers used in the Calculate Release Dates Service (CRDS). It is intended as a guide to the structure and intent of different validations, and how error messages are surfaced during processing.

Please note: this overview is **indicative**, not definitive. Individual validation methods may change over time, be renamed, removed, or reordered. This document will not necessarily be updated with every such change. However, it remains a useful reference point—particularly for analysts or developers exploring how validation messages are generated, grouped, and surfaced to users or systems.

### 1. Fail-fast Pre-calculation Validations

These validations run in strict sequence and will return immediately if any of them fail.  
If a validation message is returned at this stage, no further pre-calculation validation is performed.

1. `validateOffenderSupported`
   Checks whether the offender is supported (e.g. age, gender).

2. `hasSentences`  
   Ensures at least one sentence is present to process.

3. `validateSupportedSentences`  
   Validates sentence types are supported for calculation.

4. `validateUnsupportedCalculation`  
   Blocks known uncalculable configurations (e.g. incompatible combinations).

5. `validateUnsupportedOffences`  
   Flags specific offence codes as unsupported.

6. `validateSe20Offences`  
   Applies special handling rules for SE20 offences (e.g. SHPO-related).

### 2. Batch Pre-calculation Validations

These validations are run together. All applicable messages are collected and returned:

- `validateSentences`  
  General structural validation of sentence attributes and relationships.

- `validateAdjustmentsBeforeCalculation`  
  Verifies that adjustments (e.g. ADA, RADA) are valid within the sentence structure.

- `validateFixedTermRecall` (pre-calculation version)  
  Checks that any fixed-term recall information is logically consistent and supported.

- `validateRemandPeriodsAgainstSentenceDates`  
  Ensures remand periods align properly with sentence boundaries.

- `validatePrePcscDtoDoesNotHaveRemandOrTaggedBail`  
  Ensures pre-PCSC DTOs do not contain incompatible remand or tagged bail entries.

### 3. Batch Post-calculation Validations

These validations run after release dates are calculated. All relevant validation messages are collected:

- `validateSentenceHasNotBeenExtinguished`  
- `validateRemandOverlappingSentences`  
- `validateAdditionAdjustmentsInsideLatestReleaseDate`  
- `validateFixedTermRecallAfterCalc`  
- `validateFtrFortyOverlap`  
- `validateUnsupportedRecallTypes`  
- `validateSDSImposedConsecBetweenTrancheDatesForTrancheTwoPrisoner`  
- `validateSHPOContainingSX03Offences`  
