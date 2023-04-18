# Running tests

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