import { configureAllowedScripts } from '@ministryofjustice/hmpps-npm-script-allowlist'

export default configureAllowedScripts({
  allowlist: {
    // Needed by esbuild for watching files during development
    'node_modules/@parcel/watcher@2.5.1': 'ALLOW',
    // Provides native integration, supporting ability to write dtrace probes for bunyan
    'node_modules/dtrace-provider@0.8.8': 'ALLOW',
    // ESBuild is written in GoLang - this is needed to download prebuilt binaries for the specific platform
    'node_modules/esbuild@0.28.0': 'ALLOW',
    // Needed by jest for running tests in watch mode
    'node_modules/fsevents@2.3.3': 'ALLOW',
    // Native solution to quickly resolve module paths, used by jest and eslint
    'node_modules/unrs-resolver@1.11.1': 'ALLOW',
    // Needed by cypress to be able to run a browser for the tests
    'node_modules/cypress@15.13.1': 'ALLOW',
  },
})
