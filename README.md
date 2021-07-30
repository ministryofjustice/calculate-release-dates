# Calculate release dates

This is the user interface service for calculating release dates for people in prison.

## Dependencies
The app requires instances of these services to be available:
* hmpps-auth - for authentication
* redis - session store and token caching
* calculate-release-dates-api - for access to data stored by the calculation of release dates

## Building

Ensure you have the approprite tools installed:

`node - v14.xx`

`npm - v6.x`

Then:

`$ npm install` - to pull and install dependent node modules.

`$ npm run build` - to compile SCSS files & populate the /dist folder.

## Unit Tests (Jest)

`$ npm run lint` - to run the linter over the code

`$ npm run test` - to run unit tests

## Integration tests (Cypress/Wiremock)

Start the redis and wiremock containers

`$ docker-compose -f docker-compose-test.yaml pull`

`$ docker-compose -f docker-compose-test.yaml up`

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
Starting at the root folder of the project pull the latest images for the service and dependent containers using the following command.
`$ docker-compose pull`

Bring the containers up as follows
`$ docker-compose up --no-start --scale=calculate-release-dates=0`

Start the dependent containers as follows
`$ docker start redis hmpps-auth prison-api calculate-release-dates-db`

This service requires the equivalent api service to be running. In order to do this checkout https://github.com/ministryofjustice/calculate-release-dates-api
and run the following from the root folder
`./run-local.sh`  - to start the calculate-release-dates-api service

Start up the service
`npm install`
`$ npm run start:dev`  

Point a browser to `localhost:3000`

###2. Running ui app
Install dependencies using `npm install`, ensuring you are using >= `Node v14.x`

And then, to build the assets and start the app with nodemon:

`npm run start:dev`

### Run linter

`npm run lint`

### Dependency Checks

Some scheduled checks ensure that key dependencies are kept up to date.
They are implemented via a scheduled job in CircleCI.
See the `check_outdated` job in `.circleci/config.yml`
