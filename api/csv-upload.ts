// FLOW: Customer CSV → Airtable Leads table → Make.com automation
// TRIGGER: POST /api/csv-upload from PortalUpload.tsx
// GATE: Checks JWT tier — Free tier is blocked; paid tiers enforce lead limits
// RETURNS: { success: true, count: <number> }
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyToken } from './lib/jwt.js'

const TIER_LIMITS: Record<string, number> = { Free: 0, Starter: 300, Pro: 1000, Enterprise: 3000 }

async function countExistingLeads(accountId: string): Promise<number> {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) return 0
  const formula = encodeURIComponent(`{AccountId}="${accountId}"`)
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Leads?filterByFormula=${formula}&fields[]=AccountId`,
    { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
  )
  if (!res.ok) return 0
  const data = await res.json() as { records: unknown[] }
  return data.records?.length ?? 0
}

export const config = { api: { bodyParser: false } }

function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function extractMultipartFile(buffer: Buffer, boundary: string): Buffer | null {
  const bnd = Buffer.from(`--${boundary}`)
  const crlf = Buffer.from('\r\n\r\n')
  let start = buffer.indexOf(bnd)
  while (start !== -1) {
    const headerEnd = buffer.indexOf(crlf, start)
    if (headerEnd === -1) break
    const headerStr = buffer.slice(start, headerEnd).toString()
    if (headerStr.includes('filename=') || headerStr.includes('Content-Type')) {
      const contentStart = headerEnd + 4
      const nextBnd = buffer.indexOf(Buffer.from(`\r\n--${boundary}`), contentStart)
      if (nextBnd !== -1) return buffer.slice(contentStart, nextBnd)
    }
    start = buffer.indexOf(bnd, start + bnd.length)
  }
  return null
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

  return lines.slice(1).map(line => {
    const values: string[] = []
    let current = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        values.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    values.push(current.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

function findField(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    for (const [k, v] of Object.entries(row)) {
      if (k.toLowerCase().replace(/\s+/g, '') === key.toLowerCase().replace(/\s+/g, '')) return v
    }
  }
  return ''
}

async function createAirtableLead(lead: Record<string, string>) {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) return null

  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Leads`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: lead }),
  })

  return res.ok ? await res.json() : null
}

async function triggerMakeWebhook(data: Record<string, unknown>) {
  const url = process.env.MAKE_WEBHOOK_URL
  if (!url) return
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Tier gate: verify JWT if present, enforce limits
  const authHeader = req.headers['authorization'] as string | undefined
  const token = authHeader?.replace('Bearer ', '')
  const user = token ? await verifyToken(token) : null
  const tier = user?.tier || 'Free'
  const limit = TIER_LIMITS[tier] ?? 0

  if (tier === 'Free') {
    return res.status(403).json({ error: 'Upgrade to a paid plan to upload leads', tier: 'Free' })
  }

  // Step 1: Parse multipart form data to extract CSV file
  const contentType = req.headers['content-type'] || ''
  const boundaryMatch = contentType.match(/boundary=([^\s;]+)/)
  if (!boundaryMatch) {
    return res.status(400).json({ error: 'Missing multipart boundary' })
  }
  const boundary = boundaryMatch[1]

  let rawBody: Buffer
  try {
    rawBody = await getRawBody(req)
  } catch {
    return res.status(400).json({ error: 'Failed to read body' })
  }

  const fileBuffer = extractMultipartFile(rawBody, boundary)
  if (!fileBuffer) {
    return res.status(400).json({ error: 'No file found in upload' })
  }

  // Step 2: Parse CSV text, handling quoted fields and CRLF line endings
  const csvText = fileBuffer.toString('utf-8')
  const rows = parseCSV(csvText)

  if (rows.length === 0) {
    return res.status(400).json({ error: 'CSV is empty or has no data rows' })
  }

  const now = new Date().toISOString()
  // Use the contractor's Airtable record ID (JWT sub) as the canonical accountId
  // Falls back to company name only for legacy/unauthenticated uploads
  const accountId = user?.sub || (user?.company ?? '')

  // Enforce lead limit for paid tiers
  if (limit > 0) {
    const existing = await countExistingLeads(accountId)
    const remaining = limit - existing
    if (remaining <= 0) {
      return res.status(403).json({
        error: `You've reached your ${tier} plan limit of ${limit} leads. Upgrade to upload more.`,
        tier, limit, used: existing,
      })
    }
    // Trim CSV to fit within remaining quota
    if (rows.length > remaining) {
      rows.splice(remaining)
    }
  }

  // Step 3: Map flexible column names (Name, Email, Phone, etc.) to Airtable schema
  // Step 4: Create lead records with status "New", source "CSV Upload"
  const createdLeads = rows.map(row => {
    const fullName = findField(row, 'name', 'fullname', 'full_name', 'full name')
    const nameParts = fullName.split(' ')
    return {
      FirstName: findField(row, 'firstname', 'first_name', 'first name') || nameParts[0] || '',
      LastName: findField(row, 'lastname', 'last_name', 'last name') || nameParts.slice(1).join(' ') || '',
      Email: findField(row, 'email', 'emailaddress', 'email_address'),
      Phone: findField(row, 'phone', 'phonenumber', 'phone_number', 'mobile'),
      Service: findField(row, 'service', 'services'),
      Notes: findField(row, 'notes', 'note', 'comments'),
      AccountId: accountId,
      Status: 'New',
      Source: 'CSV Upload',
      CreatedAt: now,
    }
  })

  // Step 5: Batch insert into Airtable /Leads table (groups of 10 due to API limits)
  const chunks: typeof createdLeads[] = []
  for (let i = 0; i < createdLeads.length; i += 10) {
    chunks.push(createdLeads.slice(i, i + 10))
  }

  for (const chunk of chunks) {
    const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env
    if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
      await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Leads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: chunk.map(fields => ({ fields })) }),
      })
    }
  }

  // Step 6: Trigger Make.com webhook to start SMS/email automation sequence
  await triggerMakeWebhook({
    event: 'leads.bulk_created',
    count: createdLeads.length,
    leads: createdLeads.slice(0, 5), // send first 5 as sample
  })

  return res.status(200).json({ success: true, count: createdLeads.length })
}
