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