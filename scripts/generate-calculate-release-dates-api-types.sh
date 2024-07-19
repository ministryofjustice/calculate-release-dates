npx openapi-typescript http://localhost:8089/v3/api-docs | sed "s/\"/'/g" | sed "s/;//g" > ../server/@types/calculateReleaseDates/index.d.ts
eslint --fix "../server/@types/calculateReleaseDates/index.d.ts"
