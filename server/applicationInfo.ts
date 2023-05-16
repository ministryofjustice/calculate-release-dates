import fs from 'fs'
import path from 'path'
import config from './config'

const { buildNumber, gitRef } = config

export type ApplicationInfo = { applicationName: string; buildNumber: string; gitRef: string; gitShortHash: string }

export default (): ApplicationInfo => {
  const packageJson = path.join(__dirname, '../../package.json')
  const { name: applicationName } = JSON.parse(fs.readFileSync(packageJson).toString())
  return { applicationName, buildNumber, gitRef, gitShortHash: gitRef.substring(0, 7) }
}
