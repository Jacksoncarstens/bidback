import { getIntegrationConfig } from './integrations'

export interface AirtableLead {
  id: string
  fields: {
    FirstName?: string
    LastName?: string
    Email?: string
    Phone?: string
    Status?: string
    Source?: string
    Service?: string
    FollowUpCount?: number
    LastContact?: string
    CreatedAt?: string
    [key: string]: unknown
  }
}

export interface AirtableEvent {
  id: string
  fields: {
    LeadName?: string
    LeadId?: string
    Type?: string
    Channel?: string
    Message?: string
    Status?: string
    Timestamp?: string
    [key: string]: unknown
  }
}

interface AirtableListResponse<T> {
  records: T[]
  offset?: string
}

function getConfig() {
  return getIntegrationConfig().airtable
}

export function isAirtableConfigured(): boolean {
  const cfg = getConfig()
  return !!cfg.apiKey && !!cfg.baseId
}

async function airtableFetch<T>(tableName: string, path = '', options?: RequestInit): Promise<T> {
  const cfg = getConfig()
  const base = `https://api.airtable.com/v0/${cfg.baseId}/${encodeURIComponent(tableName)}`
  const url = path ? `${base}/${path}` : base

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Airtable error ${res.status}: ${err}`)
  }

  return res.json() as Promise<T>
}

export async function fetchLeads(maxRecords = 100): Promise<AirtableLead[]> {
  const cfg = getConfig()
  const tableName = cfg.tableName || 'Leads'
  const query = `?maxRecords=${maxRecords}&sort%5B0%5D%5Bfield%5D=CreatedAt&sort%5B0%5D%5Bdirection%5D=desc`

  const data = await airtableFetch<AirtableListResponse<AirtableLead>>(
    `${tableName}${query}`
  )
  return data.records
}

export async function fetchEvents(maxRecords = 100): Promise<AirtableEvent[]> {
  const query = `?maxRecords=${maxRecords}&sort%5B0%5D%5Bfield%5D=Timestamp&sort%5B0%5D%5Bdirection%5D=desc`
  try {
    const data = await airtableFetch<AirtableListResponse<AirtableEvent>>(
      `Events${query}`
    )
    return data.records
  } catch {
    return []
  }
}

export async function createLead(fields: Record<string, unknown>): Promise<AirtableLead> {
  const cfg = getConfig()
  const tableName = cfg.tableName || 'Leads'
  return airtableFetch<AirtableLead>(tableName, '', {
    method: 'POST',
    body: JSON.stringify({ fields }),
  })
}

export async function updateLead(recordId: string, fields: Record<string, unknown>): Promise<AirtableLead> {
  const cfg = getConfig()
  const tableName = cfg.tableName || 'Leads'
  return airtableFetch<AirtableLead>(tableName, recordId, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  })
}

export function normalizeLeadName(lead: AirtableLead): string {
  const { FirstName, LastName } = lead.fields
  return [FirstName, LastName].filter(Boolean).join(' ') || 'Unknown Lead'
}
