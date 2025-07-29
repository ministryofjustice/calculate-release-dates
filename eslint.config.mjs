import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default hmppsConfig({
  extraIgnorePaths: ['assets', 'cypress.json', 'reporter-config.json'],
  extraFrontendGlobals: ['accessibleAutocomplete'],
})
