# Check Information

## Sequence Diagram
The check information page allows us to view the sentence and offence information, along with any validation
messages that have been created by the backend.
```mermaid
sequenceDiagram
    participant B as Browser
    participant UI as CRDS UI
    participant API as CRDS API
    participant PrisonApi as Prison API
    B->>+UI: Get /calculation/{nomisId}/check-information
    UI->>+API: /validation/{nomisId}?supportCheck=true
    API-->>-UI: Response with list of unsupported sentence / calculation reasons
    alt only supported sentences
        UI->>+API: /calculation/{prisonerId}/user-questions
        API-->>-UI: List of questions
        UI->>+B: Retrieve any answered questions
        B->>-UI: Return any answered questions
        alt questions required
            note right of UI: Directed to the <br>SDS+ flow
        end
        UI->>+PrisonApi: Get Prisoner Details
        PrisonApi-->>-UI: Return prisoner details
        UI->>+PrisonApi: Get active sentences and offences
        PrisonApi-->>-UI: Return active sentences and offences
        UI->>+PrisonApi: Get adjustments
        PrisonApi-->>-UI: Return adjustments
        alt any fixed term recalls?
            UI->>+PrisonApi: Get return to custody date
            PrisonApi-->>-UI: Return return to custody date
        end
        UI->>+API: Run full validation on the backend
        API->>+PrisonApi: Get Prisoner Details
        PrisonApi-->>-API: Return prisoner details
        API->>+PrisonApi: Get active sentences and offences
        PrisonApi-->>-API: Return active sentences and offences
        API->>+PrisonApi: Get adjustments
        PrisonApi-->>-API: Return adjustments
        alt any fixed term recalls?
            API->>+PrisonApi: Get return to custody date
            PrisonApi-->>-API: Return return to custody date
        end
        API-->>-UI: Return list of validation messages
    else some unsupported sentences
        note right of UI: Directed to unsupported<br> sentence check <br>information
    end
    UI-->>-B: Render the page
```

## Support Check Flag
The support check flag will run a small portion of the validation service, to determine of the sentences and scenarios are supported by the service.
If there are unsupported sentences we will redirect the user to the [Check Information Unsupported Sentence](check-information-unsupported-sentence.md) page, with its subsequent manual entry flow.