# Types of Release Date

This document intends to inform you about the type of release dates in prison, and those produced by the Calculate Release Dates service

## Types of Release Date Produced by the Service


### Release on Home Detention Curfew / Tagging

#### Home Detention Curfew Expiry Date (HDCED)

The date from which a person with an eligible determinate sentence could be released on Home Detention and Curfew. This is also known as release on a `Tag` or `Electronic Monitoring`. 

### Release Dates

#### Automatic Release Date (ARD)
Automatic release date is the date the person with a determinate prison sentence will leave prison. They will leave without being subject to licence conditions. 

#### Conditional Release Date (CRD)
Conditional release date is the date the person with a determinate prison sentence will leave prison. They will leave being subject to licence conditions, and will therefore receive a Sentence Expiry Date and a Licence Expiry Date.

### Release from sentence conditions 

#### Licence Expiry Date (LED)
The licence expiry date is the date that the conditions expressed in the licence no longer apply to the person serving a prison sentence. 

#### Sentence Expiry Date (SED)
The sentence expiry date is the date on which the sentence is no longer in force. 

#### Top-Up Supervision Expiry Date (TUSED)
##### Also known as Post Sentence Supervision Expiry Date (PSSED)

Post Sentence Supervision was introduced by the Offender Rehabilitation Act 2014 and has the effect of increasing the combined period on supervision post-release for individuals, to 12 months post release, when subject to a determinate custodial sentence of more than one day but less than 24 months.  

Post Sentence Supervision (PSS) starts once the LED has been reached, it is managed by Probation and  runs up until the Top-Up Supervision Expiry Date (TUSED/PSSED)
### Parole Eligibility Date (PED)

The parole eligibility date (PED) is the date from which a person with a sentence requiring parole would be eligible to be released based on a determination by the parole board. A person serving a determinate sentence (not a life sentence or IPP) can apply for parole up to six months before their Parole Eligibility Date (PED).

### Post-Recall Release Date (PRRD)

Post-Recall Release Date (PRRD) is the release date following a prisoner being recalled from licence.

### Early Removal Scheme Dates

#### Early Removal Scheme Eligibility Date (ERSED)

The Early Removal Scheme is the date where any foreign national serving a fixed sentence who is liable for removal from the UK to be removed from prison and deported up to 12 months before the earliest release point (usually the halfway point) of their sentence is eligible for removal.

### Detention and Training Order (DTO) Dates 

#### Mid-Transfer Date (MTD)

A potential release point halfway point of the Detention and Training Order single term (automatic release date)

#### Early-Transfer Date (ETD)

A potential release point:
* One month before the Mid-Term Date (MTD) for Detention and Training Order (DTO)/single terms of 8 months but less than 18 months 
* Two months before Mid-Term Date (MTD) for Detention and Training Order (DTO)/single terms of 18 months to 2 years

#### Late-Transfer Date (LTD)

A potential release point:
* One months after the MTD for DTO/single terms of 8 months but less than 18 months 
* Two months after the MTD for DTO/single terms of 18 months to 2 years

## Approved Release Dates
### Types of release Date that need scheduling and approval. All approved dates are user input and not calculated dates.

### Approved Parole Date (APD)

Approved Parole Date is the date agreed by the Parole Board a person with the relevant sentence should be released. 

### Home Detention & Curfew Actual Date (HDCAD)

The date from which a person leave the prison on Home Detention and Curfew. This is also known as release on a `Tag` or `Electronic Monitoring`.

## Other Release Dates

### Actual Release Date (ARD)

The Actual Release Date is an attempt to determine the date a person is likely to leave prison (other than on temporary licence (ROTL). It uses 

The algorithm is defined roughly as follows:

```
if 'confirmed release date exists'
    releaseDate = ConfirmedReleaseDate
else if 'Approved Parole Date exists'
    releaseDate = ApprovedParoleDate
else if 'Home Detention Curfew Approved Date' exists
    releaseDate = HDCApprovedDate
else if 'there is no mid term date'
    releaseDate = 'non dto release date'
else if 'there is no non-dto-release-date'
    releaseDate = midTermDate
else if 'midterm date is after non-dto-release-date'
    releaseDate = midTermDate
else
    releaseDate = 'non do release date'
```

The underlying code is implemented as this [actual release date algorithm](https://github.com/ministryofjustice/prison-api/blob/04454f02556f4463798bff26ea2d4fea91268368/src/main/java/uk/gov/justice/hmpps/prison/repository/jpa/model/OffenderBooking.java#L407)

### Confirmed Release Date (ARD)


The confirmed release date is entered into the release schedule and is usually entered at the point of calculation to enable NART reports to run correctly. The confirmed release date is usually updated on the 14 or 2-day check to record a weekend release (if CRD was over the weekend, then the Confirmed Release Date would be set to Fri) or an early release such as HDC, and the release reason would also be set, e.g. HDC conditional release.
