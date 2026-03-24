export interface IntegrationConfig {
  airtable: {
    apiKey: string
    baseId: string
    tableName: string
  }
  stripe: {
    publishableKey: string
    webhookSecret: string
  }
  twilio: {
    accountSid: string
    authToken: string
    fromNumber: string
  }
  make: {
    webhookUrl: string
  }
  resend: {
    apiKey: string
    fromEmail: string
  }
  tally: {
    webhookSecret: string
    formId: string
  }
  zapier: {
    webhookUrl: string
  }
  slack: {
    webhookUrl: string
    channel: string
  }
  hubspot: {
    apiKey: string
    portalId: string
  }
}

const STORAGE_KEY = 'leadly_integrations'

const DEFAULT_CONFIG: IntegrationConfig = {
  airtable: { apiKey: '', baseId: '', tableName: 'Leads' },
  stripe: { publishableKey: '', webhookSecret: '' },
  twilio: { accountSid: '', authToken: '', fromNumber: '' },
  make: { webhookUrl: '' },
  resend: { apiKey: '', fromEmail: '' },
  tally: { webhookSecret: '', formId: '' },
  zapier: { webhookUrl: '' },
  slack: { webhookUrl: '', channel: '#leads' },
  hubspot: { apiKey: '', portalId: '' },
}

export function getIntegrationConfig(): IntegrationConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_CONFIG
  }
}

export function saveIntegrationConfig(config: IntegrationConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function updateIntegration<K extends keyof IntegrationConfig>(
  key: K,
  values: Partial<IntegrationConfig[K]>
): void {
  const config = getIntegrationConfig()
  config[key] = { ...config[key], ...values } as IntegrationConfig[K]
  saveIntegrationConfig(config)
}

export function isIntegrationConnected(key: keyof IntegrationConfig): boolean {
  const config = getIntegrationConfig()
  const section = config[key] as Record<string, string>
  return Object.values(section).some(v => v.trim() !== '')
}
