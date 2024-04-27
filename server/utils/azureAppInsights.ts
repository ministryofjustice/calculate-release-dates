import { defaultClient, DistributedTracingModes, setup, TelemetryClient } from 'applicationinsights'
import { TelemetryItem } from 'applicationinsights/out/src/declarations/generated'
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

    defaultClient.addTelemetryProcessor(addUserDataToRequests)

    defaultClient.addTelemetryProcessor(({ tags, data }, contextObjects) => {
      const operationNameOverride = contextObjects.correlationContext?.customProperties?.getProperty('operationName')
      if (operationNameOverride) {
        tags['ai.operation.name'] = data.baseData.name = operationNameOverride // eslint-disable-line no-param-reassign,no-multi-assign
      }
      return true
    })

    return defaultClient
  }
  return null
}

export function addUserDataToRequests(envelope: TelemetryItem, contextObjects: ContextObject | undefined): boolean {
  const isRequest = envelope.data.baseType === 'RequestData'
  if (isRequest) {
    const { username } = contextObjects?.['http.ServerRequest']?.res?.locals?.user || {}
    if (username) {
      const { properties } = envelope.data.baseData
      // eslint-disable-next-line no-param-reassign
      envelope.data.baseData.properties = {
        username,
        ...properties,
      }
    }
  }
  return true
}
