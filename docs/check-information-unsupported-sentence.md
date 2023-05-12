# Check Information Unsupported Sentence

This is the start of the unsupported sentence manual entry flow.

A check is performed here to ensure that there are unsupported sentences.

```mermaid
---
title: Unsupported Sentence Flow
---
   flowchart        
       subgraph Page Redirection [&nbsp]
           subgraph CheckInformationPage [Check Information Page]
               LCIP(Load Check \nInformation Page)-->CHK
               CHK{Unsupported Sentences \n or Scenarios?}--No?-->CARRYON((Carry on with\nCheck Information Page))
    
           end
           subgraph UnsupportedSentence [Unsupported Sentence Check Information Page]
               CHK--Yes?-->LCIPUS
               LCIPUS(Load Check Information\nPage for Unsupported\nSentences)--Recheck-->UnsupportedSentenceCheck
               LCIPUS-->RV(Run Validation)
               RV-->LV(List Validation Reasons)
               LV-->CB(Click Go Button)
               CB--Recheck-->UnsupportedSentenceCheck[Unsupported Sentences?]
               UnsupportedSentenceCheck--After clicking Go Button-->SMD(Select Manual Dates)
               SMD-->LDE(Load Date Entry Page)
               LDE--Recheck on load date entry page-->UnsupportedSentenceCheck
               LDE --> SD(Submit Date) --Next Date--> LDE
               SD--All dates submitted-->RVS(Review Screen)
               RVS--Check for unsupported sentences-->UnsupportedSentenceCheck
               RVS-->SB(Click submit button)
               SB--Final check for unsupported sentences-->UnsupportedSentenceCheck
           end
           subgraph UnsupportedSentenceCheck [Unsupported Sentence Check ]
           end
       end
       
    UnsupportedSentenceCheck--All Sentences & Scenarios Supported-->CheckInformationPage
    click CARRYON "check-information-page.md"
    
```

It is imperative that a user cannot enter dates for a sentence that *could* be calculated by the Calculate Release Dates service.
For this reason we check at each stage that there are still unsupported sentences or scenarios. This check is not a full validation, but simply a 
cut down version of the check.

If at any point we detect that the sentence or scenario is supported by the CRDS we redirect the user back to the Check Information screen so that the release dates could be calculated by the service.

## Manual Entry Storage
In order to avoid partial calculations being stored as preliminary calculations, and thus muddying the waters, I believe we need to take 
an approach whereby we build up data, and transfer it to a prelimnary calculation afterwards.

```mermaid
erDiagram
    MANUAL_ENTRY_REQUEST ||--O{ PARTIAL_MANUAL_ENTRY : adds
    MANUAL_ENTRY_REQUEST {
        serial id
        uuid calculation_reference
        varchar(10) prisoner_id
        booking_id integer
        string status
        timestamptz calculated_at
        varchar(20) calculated_by
    }
    PARTIAL_MANUAL_ENTRY {
        serial id
        uuid calculation_reference
        varchar(20) selected_date_type
        timestamptz entered_date
    }
```

Below is a potential sequence diagram for manual entry. This keeps the calculation data set clean with only submitted entries.
Potential statuses:
* IN_PROGRESS
* TRANSFERRED
* CANCELLED -> This could be future work

Once a partial calculation is in the TRANSFERRED/CANCELLED state, no more dates can be added to it.

```mermaid
sequenceDiagram
    participant B as Browser
    participant U as UI
    participant A as Api
    participant D as Database
    
    B->>U: Load manual entry selection page
    U->>A: POST /manual/{nomisId}
    A->>D: Create manual entry request
    D-->>A: return
    A-->>U: Return manual entry id
    U-->>B: return
    loop store dates 
        B->>U: load next date page
        U-->>B: page load
        B->>U: Submit date
        U->>A: Submit date for ID
        A->>D: Store date
        D-->>A: return
        A-->>U: return
        U-->>B: return
    end
    B->>U: Load review page
    U->>A: Get partial data
    A->>D: Get partial data
    D-->>A: return
    A-->>U: return
    U-->>B: render
    B->>U: Submit calculation
    U->>A: Request submit calculation
    A->>D: Transfer data from partial to calculation request
    A->>D: Update status to TRANSFERRED
    D-->>A: return
    A-->>U: return
    U-->>B: render
```