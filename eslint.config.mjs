import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default hmppsConfig({
  extraIgnorePaths: ['assets', 'cypress.json'],
  extraFrontendGlobals: ['accessibleAutocomplete'],
})
