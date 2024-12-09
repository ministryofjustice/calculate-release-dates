# Summary of Home Detention Curfew (HDC) Calculation Rules

This page explains how to determine when a prisoner can be released early under Home Detention Curfew (HDC). HDC allows eligible prisoners to spend part of their sentence outside prison under electronic monitoring, provided they comply with certain conditions.

## What is HDC?

Home Detention Curfew (HDC) is an arrangement that lets certain prisoners leave custody before their scheduled release date, subject to an electronic tag and a curfew. Not everyone is eligible, and the rules for working out the earliest possible HDC release date are detailed below.

## Key Terms

- **Conditional Release Date (CRD)**: The date on which the prisoner would normally be released if HDC did not apply.
- **Requisite Custodial Period**: The part of the sentence that must be served before any form of early release.
- **Remand**: Time spent in custody before sentencing.
- **Tagged Bail**: Bail granted with electronic monitoring before sentencing.
- **UAL/ADA/RADA**: Specific types of absences or additional days that might affect custody calculations.   *(These terms are technical and explained in full guidance documents.)*

## Minimum Requirements for HDC

1. **Minimum Custodial Period**: The time from the sentence date up to the initial CRD (without adjustments) must be at least 42 days (6 weeks).
2. **Minimum Time Served**: The prisoner must serve at least half of this period, with a minimum of 28 days actually spent in custody. If half the period is less than 28 days, then 28 days is used instead.
3. **14-Day Rule**: Regardless of remand or tagged bail credits, the prisoner must spend at least 14 days in prison after the sentencing date before HDC can begin.
4. *If a prisoner has an active sex offender registration, they will not be given a HDC Eligibility Date (HDCED).*
 
## Calculating the HDC Eligibility Date (HDCED) Before June 2025

### If the Requisite Custodial Period Is 42–359 Days

1. Work out half of the requisite custodial period. If this half is less than 28 days, use 28 days instead.
2. Subtract any days spent on remand or tagged bail from this figure.
3. Add the adjusted figure to the sentencing date. This gives the initial HDCED.
4. If this initial HDCED would mean releasing them before they have served the mandatory 14 days post-sentencing, move it forward so they serve at least 14 days first.

*(The boundary for changing the method of calculation is 360 days.)*

### If the Requisite Custodial Period Is 360 Days or More

1. Determine the effective CRD (after accounting for remand, tagged bail, or other adjustments).
2. Count back 179 days (just under 180) from the effective CRD to set the HDCED.
3. If this date is within 14 days of the sentencing date, adjust it so that the prisoner has served at least 14 days after sentencing.

## Calculating the HDC Eligibility Date (HDCED) from 3rd June 2025 Onwards

From 3rd June 2025, there is a change for prisoners serving longer sentences (where the requisite custodial period is 720 days or more):

- Instead of the 360 day requisite custodial period
- Instead of the maximum early release window being 180 days before the end of the requisite custodial period, it will extend to 365 days.

### Adjusting Important Dates

- If, after applying the post-3rd June 2025 rules, the HDCED falls before 3rd June 2025, you must move it to 3rd June 2025. This ensures the updated rules do not produce an HDCED before the date the new rules take effect.
- Prisoners already given an HDCED that falls before 3rd June 2025 keep their original date.
- If an existing HDCED falls on or after 3rd June 2025, but a recalculation using the new rules would produce an earlier date, the HDCED should not be earlier than 3rd June 2025.
- The length threshold for changing the calculation method moves from 360 days to 730 days.

### For Requisite Custodial Periods of 42–359 Days (No Change)

- Still calculate as before: half the custodial period (or 28 days if half is less than 28), minus remand/tagged bail, plus sentencing date, and ensure at least 14 days post-sentencing are served.

### For Requisite Custodial Periods of 360–719 Days (No Change)
- Calculate half the custodial period, as above, minus remand/tagged bail, plus sentencing date, and ensure at least 14 days post-sentencing are served.

### For Requisite Custodial Periods of 720 Days or More After June 2025

1. Determine the effective CRD.
2. Count back 364 days (one less than 365) from the CRD.
3. If this new HDCED comes out before 3rd June 2025, adjust it to 3rd June 2025.
4. Check that the prisoner has served at least 14 days since the sentence date. If not, move the date forward to meet the 14-day requirement.

## Multiple Sentences

### Concurrent Sentences

- Calculate HDC for each standard determinate sentence (SDS) separately.
- The earliest possible HDC release is the latest HDCED among all the concurrent sentences.
- If any sentence makes the prisoner ineligible or presumed unsuitable for HDC, then HDC does not occur unless there are exceptional circumstances.
- HDC cannot occur before the CRD (or Automatic Release Date, ARD) of any sentence in the group that is ineligible for HDC.
- If the period of custody includes a sentence type that excludes HDC (e.g., SDS+), then HDC does not apply, even if other sentences would allow it.
- If there is an Extended Determinate Sentence (EDS) or a sentence for offenders of particular concern (SOPC) running at the same time, the prisoner might be presumed unsuitable for HDC, depending on which sentence sets the latest CRD.

### Consecutive Sentences

- Consecutive SDS sentences are treated as one combined sentence. HDC is based on the total combined length.
- If one of the sentences is not eligible for HDC, remove its length from the calculation. However, having an ineligible sentence means the prisoner is presumed unsuitable for HDC unless exceptional circumstances apply.
- If any sentence within the consecutive set is parole-eligible, subject to two-thirds release, or falls under special rules (such as a Section 244ZB notice), HDC either does not apply or the prisoner is presumed unsuitable.

### List of Configured Values and Their Sources in the Codebase:**

- **Minimum Custodial Period (42 days)**:  
  [`minimum-custodial-period-days`](https://github.com/ministryofjustice/calculate-release-dates-api/blob/6ae73923b549888c311ad0193dcb4ae9c37704f0/src/main/resources/application-calculation-params.yml#L3)

- **Minimum Deduction If Half Is Less Than 28 Days (28 days)**:  
  [`custodial-period-below-midpoint-minimum-deduction-days`](https://github.com/ministryofjustice/calculate-release-dates-api/blob/6ae73923b549888c311ad0193dcb4ae9c37704f0/src/main/resources/application-calculation-params.yml#L5)

- **Mid-Point Boundary for Custodial Period (360 days)**:  
  [`custodial-period-mid-point-days`](https://github.com/ministryofjustice/calculate-release-dates-api/blob/6ae73923b549888c311ad0193dcb4ae9c37704f0/src/main/resources/application-calculation-params.yml#L6)

- **Minimum Days Served Post-Sentencing (14 days)**:  
  [`minimum-days-on-hdc`](https://github.com/ministryofjustice/calculate-release-dates-api/blob/6ae73923b549888c311ad0193dcb4ae9c37704f0/src/main/resources/application-calculation-params.yml#L7)

- **Pre-June 2025 Deduction for Longer Sentences (179 days)**:  
  [`custodial-period-above-midpoint-deduction-days` (for pre-June 2025 scenarios)](https://github.com/ministryofjustice/calculate-release-dates-api/blob/6ae73923b549888c311ad0193dcb4ae9c37704f0/src/main/resources/application-calculation-params.yml#L6)

- **Post-June 2025 Deduction for Longer Sentences (364 days)**:  
  [`custodial-period-above-midpoint-deduction-days` (for post-June 2025 scenarios)](https://github.com/ministryofjustice/calculate-release-dates-api/blob/6ae73923b549888c311ad0193dcb4ae9c37704f0/src/main/resources/application-calculation-params.yml#L4)

---

**Note**: This summary provides general guidelines. For full details, definitions, and procedural steps, please refer to the complete [Home Detention Curfew Policy Framework](https://assets.publishing.service.gov.uk/media/66701aa6fdbf70d6d79d9705/Home_Detention_Curfew_V7___002_.pdf) and associated operational guidance.
