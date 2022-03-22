
# Calculate release dates

[![repo standards badge](https://img.shields.io/badge/dynamic/json?color=blue&style=for-the-badge&logo=github&label=MoJ%20Compliant&query=%24.data%5B%3F%28%40.name%20%3D%3D%20%22calculate-release-dates%22%29%5D.status&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fgithub_repositories)](https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/github_repositories#calculate-release-dates "Link to report")

This is the user interface service for calculating release dates for people in prison.

## Dependencies
The app requires instances of these services to be available:
* hmpps-auth - for authentication
* redis - session store and token caching
* calculate-release-dates-api - for access to data stored by the calculation of release dates
* prison-api - prison data
* prisoner-offender-search - prisoner search

## Building

Ensure you have the appropriate tools installed:

`node >= v14.xx < v15`

`npm >= v6.4x`

Then:

`$ npm install` - to pull and install dependent node modules.

`$ npm run build` - to compile SCSS files & populate the /dist folder.

## Unit Tests (Jest)

`$ npm run lint` - to run the linter over the code

`$ npm run test` - to run unit tests

## Integration tests (Cypress/Wiremock)

Start the redis and wiremock containers

`$ docker-compose -f docker-compose-test.yml pull`

`$ docker-compose -f docker-compose-test.yml up`

In a different terminal:

`$ npm run start-feature` - to start the service with settings that will be recognised by the wiremocked services.

OR

`$ npm run start-feature:dev` - to start the with nodemon active for tests.

In a third terminal

`$ npm run build` - to build the application

`$ npm run int-test` - to run Cypress tests in the background

OR

`$ npm run int-test-ui` - to run tests via the Cypress control panel

## Running and developing locally
### Method 1 - connecting to the services in the DEV environment
1. Create a `.env` file in the root of the project with the following content - Note - you will need to get the secret values from DEV:
```   
   HMPPS_AUTH_URL="https://sign-in-dev.hmpps.service.justice.gov.uk/auth"
   TOKEN_VERIFICATION_API_URL="https://token-verification-api-dev.prison.service.justice.gov.uk"
   CALCULATE_RELEASE_DATES_API_URL="https://calculate-release-dates-api-dev.hmpps.service.justice.gov.uk"
   PRISON_API_URL="https://api-dev.prison.service.justice.gov.uk"
   PRISONER_SEARCH_API_URL=https://prisoner-offender-search-dev.prison.service.justice.gov.uk
   API_CLIENT_SECRET= FILL THIS IN WITH SECRET FROM DEV!!
   SYSTEM_CLIENT_SECRET= FILL THIS IN WITH SECRET FROM DEV!!
```   

2. Start the redis container.

   `$ docker-compose -f docker-compose-dev.yml up -d`


4. Start a local `calculate-release-dates` service with `$ npm run start`, which will use the `.env` file to set
   up its environment to reference the DEV APIs.


5. Bear in mind that the login details, and all data you will see, will be from the `calculate-release-dates-db` and APIs in the DEV
   environment. Only the redis functions will be local operations.

### Method 2 - running everything locally
####Note: the prisoner-search-service is not currently set up to run locally. If you need it then use Method 1
1. Starting at the root folder of the project pull the latest images for the service and dependent containers using the following command.
`$ docker-compose pull`

2. Then use the script:
`$ run-full.sh` -follow the onscreen instructions.

Point a browser to `localhost:3000`

the username is CALCULATE_RELEASE_DATES_LOCAL
The password is : password123456

### Running ui app
Install dependencies using `npm install`, ensuring you are using >= `Node v14.x`

And then, to build the assets and start the app with nodemon:

`npm run start:dev`

### Run linter

`npm run lint`

### Dependency Checks

Some scheduled checks ensure that key dependencies are kept up to date.
They are implemented via a scheduled job in CircleCI.
See the `check_outdated` job in `.circleci/config.yml`

## Generating types from OpenAPI

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
