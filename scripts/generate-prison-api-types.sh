npx openapi-typescript https://prison-api-dev.prison.service.justice.gov.uk/v3/api-docs | sed "s/\"/'/g" | sed "s/;//g" > ../server/@types/prisonApi/index.d.ts
eslint --fix "../server/@types/prisonApi/index.d.ts"
