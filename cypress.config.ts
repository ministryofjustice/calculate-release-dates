import { defineConfig } from "cypress";

export default defineConfig({
  chromeWebSecurity: false,
  fixturesFolder: "integration_tests/fixtures",
  screenshotsFolder: "integration_tests/screenshots",
  videosFolder: "integration_tests/videos",
  reporter: "cypress-multi-reporters",

  reporterOptions: {
    configFile: "reporter-config.json",
  },

  videoUploadOnPasses: false,
  taskTimeout: 60000,

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
