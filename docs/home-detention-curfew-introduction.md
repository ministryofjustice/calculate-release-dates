# Summary of Home Detention Curfew (HDC) Calculation Rules

## Overview of HDC

Home Detention Curfew (HDC) allows eligible prisoners to be released from custody before their normal release date under an electronically monitored curfew and conditions. Calculating the earliest possible HDC release date requires determining the “requisite custodial period” and applying specific rules that consider factors such as remand time, tagged bail, and sentence type.

## Requisite Custodial Period

- The “requisite custodial period” is the time from the date of sentence to the initial Conditional Release Date (CRD), before applying any adjustments like remand or tagged bail credit.
- This period must be at least [42 days (6 weeks) as `minimum-custodial-period-days`](https://github.com/ministryofjustice/calculate-release-dates-api/blob/6ae73923b549888c311ad0193dcb4ae9c37704f0/src/main/resources/application-calculation-params.yml#L3)  for HDC eligibility.

## Minimum Time to Serve Before HDC

- The prisoner must serve at least half of the requisite custodial period and a minimum of 4 weeks (28 days) within that period.
- If half of the requisite period is less than [28 days as `custodial-period-below-midpoint-minimum-deduction-days`](https://github.com/ministryofjustice/calculate-release-dates-api/blob/6ae73923b549888c311ad0193dcb4ae9c37704f0/src/main/resources/application-calculation-params.yml#L5), use 28 days as the minimum.
- There is a mandatory requirement that the prisoner must spend at least 14 days in custody after the date of sentence, regardless of any remand or tagged bail credits.

## Determining the HDC Eligibility Date (HDCED) for pre-June 2025

1. **For Requisite Custodial Periods of 42–359 Days**:
    - Calculate half of the requisite custodial period (round up if necessary).
    - If the result is less than 28 days, use 28 days instead.
    - Subtract any remand or tagged bail days from this figure.
    - Add the resulting figure to the actual date of sentence to find the initial HDCED.
    - If this initial HDCED is before the offender has served 14 days from the date of sentence, move it forward so that they have served at least [14 days as `minimum-days-on-hdc`](https://github.com/ministryofjustice/calculate-release-dates-api/blob/6ae73923b549888c311ad0193dcb4ae9c37704f0/src/main/resources/application-calculation-params.yml#L7) after sentencing.
    - Boundary of [360 days](https://github.com/ministryofjustice/calculate-release-dates-api/blob/6ae73923b549888c311ad0193dcb4ae9c37704f0/src/main/resources/application-calculation-params.yml#L6) as `custodial-period-mid-point-days`
2. **For Requisite Custodial Periods of 360 Days or More**:
    - Find the effective CRD (including any remand, tagged bail, or other adjustments).
    - Count back [179 (180 minus one day) as `custodial-period-above-midpoint-deduction-days`](https://github.com/ministryofjustice/calculate-release-dates-api/blob/6ae73923b549888c311ad0193dcb4ae9c37704f0/src/main/resources/application-calculation-params.yml#L6) days from the effective CRD to set the HDCED. 
    - If this falls within the first [14 days as `minimum-days-on-hdc`](https://github.com/ministryofjustice/calculate-release-dates-api/blob/6ae73923b549888c311ad0193dcb4ae9c37704f0/src/main/resources/application-calculation-params.yml#L7) after sentencing, adjust so that the prisoner serves at least 14 days from the date of sentence.

## Determining the HDC Eligibility Date (HDCED) from 3rd June 2025 Onwards

*(Changes introduced by the [Draft Statutory Instrument 2024](https://www.legislation.gov.uk/ukdsi/2024/9780348265729))*

From 3rd June 2025, the calculation of the HDCED changes for sentences with a long requisite custodial period. The key difference is the increase in the maximum possible early release window for prisoners serving longer sentences (those with a requisite custodial period of 360 days or more) from 180 days to 365 days before the requisite custodial period ends.

**Important:** If after applying the post-3rd June 2025 calculation rules, the resulting HDCED falls before 3rd June 2025, the HDCED must be adjusted to 3rd June 2025. This safeguard also applies to prisoners who are recalled and whose HDCED is recalculated under these new provisions.


1. **For Requisite Custodial Periods of 42–359 Days** (no change):
    - Calculate half of the requisite custodial period (round up if necessary).
    - If the result is less than 28 days, use 28 days instead.
    - Subtract any remand or tagged bail days from this figure.
    - Add the resulting figure to the actual date of sentence to find the initial HDCED.
    - If this initial HDCED is before the offender has served [14 days as `minimum-days-on-hdc`](https://github.com/ministryofjustice/calculate-release-dates-api/blob/6ae73923b549888c311ad0193dcb4ae9c37704f0/src/main/resources/application-calculation-params.yml#L7) after sentencing, move it forward so that the 14-day minimum is met.
    - Boundary of [360 days as `custodial-period-mid-point-days`](https://github.com/ministryofjustice/calculate-release-dates-api/blob/6ae73923b549888c311ad0193dcb4ae9c37704f0/src/main/resources/application-calculation-params.yml#L6) remains in effect.

2. **For Requisite Custodial Periods of 360 Days or More (Post-June 2025)**:
    - Determine the effective CRD (including any remand, tagged bail, or other adjustments).
    - Count back [364 (365 minus one day) as `custodial-period-above-midpoint-deduction-days`](https://github.com/ministryofjustice/calculate-release-dates-api/blob/6ae73923b549888c311ad0193dcb4ae9c37704f0/src/main/resources/application-calculation-params.yml#L4) days from the effective CRD to set the HDCED.
    - Check Commencement Date**: If the calculated HDCED is earlier than 3rd June 2025, adjust it so that the HDCED is no earlier than 3rd June 2025. This applies to all relevant cases, including when a prisoner is recalled and the HDCED is recalculated under these new rules.
    - If this HDCED falls within the first [14 days as `minimum-days-on-hdc`](https://github.com/ministryofjustice/calculate-release-dates-api/blob/6ae73923b549888c311ad0193dcb4ae9c37704f0/src/main/resources/application-calculation-params.yml#L7) after sentencing (for example long remand period), adjust so that the prisoner serves at least 14 days after the date of sentence.

These changes implement the amendments made by the Home Detention Curfew and Requisite and Minimum Custodial Periods (Amendment) Order 2024, aligning HDC release eligibility for longer sentences with the revised statutory provisions. Practitioners should refer to the updated legislation and guidance for full details on how these alterations interact with existing calculations and exception cases.





## Multiple Sentences

### Concurrent Sentences

- Each standard determinate sentence (SDS) is calculated separately, with its own HDCED and CRD.
- The prisoner’s earliest HDC release cannot be before the latest HDCED among the concurrent sentences.
- If any concurrent sentence is statutorily excluded from HDC or makes the prisoner presumed unsuitable, then HDC cannot occur unless exceptional circumstances exist.
- HDC release cannot happen before the CRD (or Automatic Release Date, ARD) of any ineligible sentence within the concurrent group.

### Consecutive Sentences

- Consecutive SDSs are treated as one combined (aggregated) sentence for release purposes, including HDC.
- HDC eligibility is calculated using the length of the aggregated sentence.
- If one of the consecutive sentences is ineligible for HDC, remove its length from the calculation. The presence of an ineligible sentence means the prisoner is presumed unsuitable for HDC unless there are exceptional circumstances.
- If any sentence in the aggregate is parole-eligible, or subject to two-thirds release or special provisions (e.g., a notice under section 244ZB), HDC does not apply, or the prisoner is presumed unsuitable.

---

This summary is based on the policies and principles set out in the [Home Detention Curfew Policy Framework](https://assets.publishing.service.gov.uk/media/66701aa6fdbf70d6d79d9705/Home_Detention_Curfew_V7___002_.pdf). It outlines how to calculate the HDC Eligibility Date, manage multiple sentences, and apply the minimum time-in-custody requirements. 
Practitioners should **exclusively** refer to the full Policy Framework and relevant operational guidance for more detailed examples and instructions.
