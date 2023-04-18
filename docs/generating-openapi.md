
# Generating types from OpenAPI

This service makes use of imported types generated from the openAPI definitions offered by each of the APIs.
Whenever the APIs change or new types are added, the scripts can be re-run to import these and make them available.
The types are committed into Git.

Scripts are provided to generate these types from the development instances:

`generate-calculate-release-dates-api-types.sh` - Re-run when CRD API types change

`generate-prison-api-types.sh` - Re-run when prisoner API types change

`generate-prisoner-offender-search-types.sh`  Re-run when prisoner offender search API types change

There may be some manual editing needed, particularly to:

- Replace double quotes with single-quotes
- Remove all semi-colons
- Validate the api-docs endpoint for swagger (in case it changes)
- Eslint ignore any lines which complain about not being camel-case with `eslint-disable camelcase`
- Eslint ignore empty interfaces with `eslint-disable-next-line @typescript-eslint/no-empty-interface`
  or remove the unused and empty interface.
