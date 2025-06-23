## Support Validation in CRDS

The **support validation** layer is a focused subset of pre-calculation validations used to determine whether the Calculate Release Dates Service (CRDS) can proceed with a calculation. It runs early in the process, often before full calculation logic is triggered, and acts as a strict gatekeeper.

### Purpose

This layer is designed to:

- Prevent unnecessary processing for unsupported sentence types or combinations
- Give fast, clear feedback about whether CRDS can calculate the release dates
- Route unsupported configurations directly into a manual date entry flow

### What It Checks

The support validation layer applies only two checks:

- A check that all sentence types are supported for calculation
- A check that the overall configuration of the sentence data does not fall into a known uncalculable pattern

If either check fails, CRDS will not attempt to calculate release dates. Instead, users will be instructed to enter dates manually from the paper calculation sheet or another verified source.

### How It Differs from Full Validation

This layer is not the same as the broader validation suite run later in the process. It does not include remand checks, adjustment validation, or post-calculation checks. It exists solely to determine whether a calculation can begin, not whether it is fully valid.

### When to Use This Document

This explanation is useful for analysts, developers, or testers trying to understand:

- Why certain calculations are blocked early
- What rules govern those early exits
- How the journey flow is determined in CRDS before full validation is applied

It complements the broader documentation on validation layers but should not be confused with full structural validation logic.
