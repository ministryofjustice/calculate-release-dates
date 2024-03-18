npx openapi-typescript https://prisoner-search-dev.prison.service.justice.gov.uk/v3/api-docs  | sed "s/\"/'/g" | sed "s/;//g" > ../server/@types/prisonerOffenderSearch/index.d.ts
eslint --fix "../server/@types/prisonerOffenderSearch/index.d.ts"
