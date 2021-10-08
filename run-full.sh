#
# Starts the full-featured calculate-release-dates service with dependecies.
# With the exception of the prisoner-search-service - this has not been configured to run locally.
# If you need the prisoner-search-service then connect to the dev service using 'Method 1' in the README
# Provides instructions for setting up dependent services.
#
# Assumes that calculate-release-dates and calculate-release-dates-api will
# be run locally outside of docker.
#

# Create docker containers
docker-compose up --no-start 

echo "Starting required docker containers"
docker start redis hmpps-auth calculate-release-dates-db prison-api

echo "Run the calculate-release-dates-api in another terminal"
echo " $ ./run-local.sh  - to run the api and migrate/seed the database"

echo "Run the UI service locally"
echo " $ npm run start:dev"

echo " Point your browser at localhost:3000"

# End
