import { Contracts, setup, defaultClient, TelemetryClient, DistributedTracingModes } from 'applicationinsights'
import { EnvelopeTelemetry } from 'applicationinsights/out/Declarations/Contracts'
import type { ApplicationInfo } from '../applicationInfo'

export type ContextObject = {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  [name: string]: any
}

export function initialiseAppInsights(): void {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    // eslint-disable-next-line no-console
    console.log('Enabling azure application insights')

    setup().setDistributedTracingMode(DistributedTracingModes.AI_AND_W3C).start()
  }
}

export function buildAppInsightsClient(
  { applicationName, buildNumber }: ApplicationInfo,
  overrideName?: string,
): TelemetryClient {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    defaultClient.context.tags['ai.cloud.role'] = overrideName || applicationName
    defaultClient.context.tags['ai.application.ver'] = buildNumber
    defaultClient.addTelemetryProcessor(addCustomDataToRequests)
    return defaultClient
  }
  return null
}

export function addCustomDataToRequests(
  envelope: EnvelopeTelemetry,
  contextObjects: ContextObject | undefined,
): boolean {
  const isRequest = envelope.data.baseType === Contracts.TelemetryTypeString.Request
  if (isRequest) {
    const { username } = contextObjects?.['http.ServerRequest']?.res?.locals?.user || {}
    const prisonId = contextObjects?.['http.ServerRequest']?.prisoner?.agencyId || null
    const { properties } = envelope.data.baseData
    // eslint-disable-next-line no-param-reassign
    envelope.data.baseData.properties = {
      ...properties,
      ...(username && { username }),
      ...(prisonId && { prisonId }),
    }
  }
  return true
}
