import { defineConfig } from 'cypress'

export default defineConfig({
  chromeWebSecurity: false,
  fixturesFolder: 'cypress/fixtures',
  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos',
  reporter: 'cypress-multi-reporters',

  reporterOptions: {
    configFile: 'reporter-config.json',
  },

  videoUploadOnPasses: false,
  taskTimeout: 60000,

  e2e: {
    setupNodeEvents() {
      // implement node event listeners here
    },
  },
})
