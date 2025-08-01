# Running and developing locally
## Method 1 - connecting to the services in the DEV environment
1. Ensure that you have env var`NODE_OPTIONS` set to `-r dotenv/config`, else the `.env` file will not be read

2. Create a `.env` file in the root of the project with the following content - Note - you will need to get the secret values from DEV:
```   
   ENVIRONMENT_NAME=dev
   REDIS_ENABLED=false
   HMPPS_AUTH_URL="https://sign-in-dev.hmpps.service.justice.gov.uk/auth"
   TOKEN_VERIFICATION_API_URL="https://token-verification-api-dev.prison.service.justice.gov.uk"
   CALCULATE_RELEASE_DATES_API_URL="https://calculate-release-dates-api-dev.hmpps.service.justice.gov.uk"
   PRISON_API_URL="https://api-dev.prison.service.justice.gov.uk"
   PRISONER_SEARCH_API_URL=https://prisoner-search-dev.prison.service.justice.gov.uk
   AUTH_CODE_CLIENT_SECRET= FILL THIS IN WITH SECRET FROM DEV!!
   CLIENT_CREDS_CLIENT_SECRET= FILL THIS IN WITH SECRET FROM DEV!!
```   

3. Start a local `calculate-release-dates` service with `$ npm run start`, which will use the `.env` file to set
   up its environment to reference the DEV APIs.


4. Bear in mind that the login details, and all data you will see, will be from the `calculate-release-dates-db` and APIs in the DEV
   environment. Only the redis functions will be local operations.

## Method 2 - running everything locally
### Note: the prisoner-search-service is not currently set up to run locally. If you need it then use Method 1
1. Starting at the root folder of the project pull the latest images for the service and dependent containers using the following command.
   `$ docker-compose pull`

2. Then use the script:
   `$ run-full.sh` -follow the onscreen instructions.

Point a browser to `localhost:3000`

Login using the user credentials detailed [here](https://dsdmoj.atlassian.net/wiki/spaces/CS/pages/5710774603/Local+Development#Local-user-credentials)

## Running ui app
Install dependencies using `npm install`, ensuring you are using >= `Node v14.x`

And then, to build the assets and start the app with nodemon:

`npm run start:dev`

## Run linter

`npm run lint`

## Dependency Checks

Some scheduled checks ensure that key dependencies are kept up to date.
They are implemented via scheduled jobs in github actions
