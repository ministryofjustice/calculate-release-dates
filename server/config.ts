import dayjs from 'dayjs'
import 'dotenv/config'

const production = process.env.NODE_ENV === 'production'

function get<T>(name: string, fallback: T, options = { requireInProduction: false }): T | string {
  if (process.env[name]) {
    return process.env[name]
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

const requiredInProduction = { requireInProduction: true }

export class AgentConfig {
  timeout: number

  constructor(timeout = 8000) {
    this.timeout = timeout
  }
}

export interface ApiConfig {
  url: string
  timeout: {
    response: number
    deadline: number
  }
  agent: AgentConfig
}

export default {
  https: production,
  staticResourceCacheDuration: '1h',
  redis: {
    host: get('REDIS_HOST', 'localhost', requiredInProduction),
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_AUTH_TOKEN,
    tls_enabled: get('REDIS_TLS_ENABLED', 'false'),
  },
  session: {
    secret: get('SESSION_SECRET', 'app-insecure-default-session', requiredInProduction),
    expiryMinutes: Number(get('WEB_SESSION_TIMEOUT_IN_MINUTES', 20)),
  },
  apis: {
    hmppsAuth: {
      url: get('HMPPS_AUTH_URL', 'http://localhost:9090/auth', requiredInProduction),
      externalUrl: get('HMPPS_AUTH_EXTERNAL_URL', get('HMPPS_AUTH_URL', 'http://localhost:9090/auth')),
      timeout: {
        response: Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('HMPPS_AUTH_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000))),
      apiClientId: get('API_CLIENT_ID', 'calculate-release-dates-client', requiredInProduction),
      apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret', requiredInProduction),
      systemClientId: get('SYSTEM_CLIENT_ID', 'calculate-release-dates-admin', requiredInProduction),
      systemClientSecret: get('SYSTEM_CLIENT_SECRET', 'client_secret', requiredInProduction),
    },
    manageUsersApi: {
      url: get('MANAGE_USERS_API_URL', 'http://localhost:9091', requiredInProduction),
      timeout: {
        response: Number(get('MANAGE_USERS_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('MANAGE_USERS_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('MANAGE_USERS_API_TIMEOUT_RESPONSE', 10000))),
    },
    tokenVerification: {
      url: get('TOKEN_VERIFICATION_API_URL', 'http://localhost:8100', requiredInProduction),
      timeout: {
        response: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_DEADLINE', 5000)),
      },
      agent: new AgentConfig(Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000))),
      enabled: get('TOKEN_VERIFICATION_ENABLED', 'false') === 'true',
    },
    calculateReleaseDates: {
      url: get('CALCULATE_RELEASE_DATES_API_URL', 'http://localhost:8089', requiredInProduction),
      timeout: {
        response: Number(get('CALCULATE_RELEASE_DATES_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('CALCULATE_RELEASE_DATES_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('CALCULATE_RELEASE_DATES_API_TIMEOUT_RESPONSE', 10000))),
    },
    prisonApi: {
      url: get('PRISON_API_URL', 'http://localhost:8080', requiredInProduction),
      timeout: {
        response: get('PRISON_API_TIMEOUT_RESPONSE', 10000),
        deadline: get('PRISON_API_TIMEOUT_DEADLINE', 10000),
      },
      agent: new AgentConfig(Number(get('PRISON_API_TIMEOUT_RESPONSE', 10000))),
    },
    prisonerSearch: {
      url: get('PRISONER_SEARCH_API_URL', 'http://localhost:8084', requiredInProduction),
      timeout: {
        response: get('PRISONER_SEARCH_API_TIMEOUT_RESPONSE', 10000),
        deadline: get('PRISONER_SEARCH_API_TIMEOUT_DEADLINE', 10000),
      },
      agent: new AgentConfig(Number(get('PRISONER_SEARCH_API_TIMEOUT_RESPONSE', 10000))),
    },
    digitalPrisonServices: {
      ui_url: get('DIGITAL_PRISON_SERVICES_URL', 'http://localhost:3000/dps', requiredInProduction),
    },
    frontendComponents: {
      url: get('COMPONENT_API_URL', 'http://localhost:8082', requiredInProduction),
      timeout: {
        response: Number(get('FRONTEND_COMPONENT_API_TIMEOUT', 500)),
        deadline: Number(get('FRONTEND_COMPONENT_API_TIMEOUT', 500)),
      },
    },
  },
  domain: get('INGRESS_URL', 'http://localhost:3000', requiredInProduction),
  analytics: {
    tagManagerContainerId: get('TAG_MANAGER_CONTAINER_ID', false),
  },
  featureToggles: {
    edsSopcRecalls: get('EDS_SOPC_RECALLS', false) === 'true',
    manualEntry: get('MANUAL_ENTRY_TOGGLE', false) === 'true',
    approvedDates: get('APPROVED_DATES_TOGGLE', false) === 'true',
    dpsBannerEnabled: get('DPS_BANNER_ENABLED', false) === 'true',
    specialistSupport: get('SPECIALIST_SUPPORT_ENABLED', false) === 'true',
    nonFridayRelease: get('NON_FRIDAY_RELEASE_TOGGLE', false) === 'true',
    nonFridayReleasePolicyStartDate: dayjs(get('NON_FRIDAY_RELEASE_START_DATE', '2023-10-26')),
    changesSinceLastCalculation: get('CHANGES_SINCE_LAST_CALCULATION', false) === 'true',
    calculationReasonToggle: get('CALCULATION_REASON_TOGGLE', false) === 'true',
    hdc4ComparisonTabEnabled: get('HDC4_PLUS_COMPARISON_TAB_ENABLED', false) === 'true',
  },
}
