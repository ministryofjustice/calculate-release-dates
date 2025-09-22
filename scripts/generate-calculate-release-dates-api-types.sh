npx openapi-typescript https://calculate-release-dates-api-dev.hmpps.service.justice.gov.uk/v3/api-docs | sed "s/\"/'/g" | sed "s/;//g" > ../server/@types/calculateReleaseDates/index.d.ts
eslint --fix "../server/@types/calculateReleaseDates/index.d.ts"
