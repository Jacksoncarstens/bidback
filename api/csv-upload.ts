// FLOW: Customer CSV → Airtable Leads table → Make.com automation
// TRIGGER: POST /api/csv-upload from PortalUpload.tsx
// AUTH: JWT required — Free tier blocked; paid tiers enforce lead limits
// RATE LIMIT: 1 upload per contractor per hour
// FILE SIZE: 5 MB max
// ENCRYPTION: Phone + Email encrypted at rest; PhoneHash stored for Twilio lookups
// RETURNS: { success: true, count: <number> }
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyToken } from './lib/jwt.js'
import { checkRateLimit, HOUR_MS } from './lib/rate-limit.js'
import { applyCors } from './lib/cors.js'
import { encrypt, hashForLookup } from './lib/encrypt.js'

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

const MAX_FILE_BYTES = 5 * 1024 * 1024  // 5 MB

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!applyCors(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Auth: JWT required
  const token = (req.headers['authorization'] as string | undefined)?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  const user = await verifyToken(token)
  if (!user) return res.status(403).json({ error: 'Invalid or expired token' })

  const tier = user?.tier || 'Free'
  const limit = TIER_LIMITS[tier] ?? 0

  if (tier === 'Free') {
    return res.status(403).json({ error: 'Upgrade to a paid plan to upload leads', tier: 'Free' })
  }

  // Rate limit: 1 upload per contractor per hour
  const hour = new Date().toISOString().slice(0, 13) // "YYYY-MM-DDTHH"
  const rl = checkRateLimit(`${user.sub}:csv_upload:${hour}`, 1, HOUR_MS)
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(Math.ceil((rl.resetAt - Date.now()) / 1000)))
    return res.status(429).json({ error: 'Upload rate limit exceeded (1 per hour). Try again soon.' })
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

  // File size check: reject payloads over 5 MB
  if (rawBody.length > MAX_FILE_BYTES) {
    return res.status(413).json({ error: 'File too large. Maximum size is 5 MB.' })
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
  //         PII fields (Phone, Email) are encrypted at rest; PhoneHash enables Twilio reply matching.
  const createdLeads = rows.map(row => {
    const fullName = findField(row, 'name', 'fullname', 'full_name', 'full name')
    const nameParts = fullName.split(' ')
    const rawPhone = findField(row, 'phone', 'phonenumber', 'phone_number', 'mobile')
    const rawEmail = findField(row, 'email', 'emailaddress', 'email_address')
    return {
      FirstName:  findField(row, 'firstname', 'first_name', 'first name') || nameParts[0] || '',
      LastName:   findField(row, 'lastname', 'last_name', 'last name') || nameParts.slice(1).join(' ') || '',
      Email:      encrypt(rawEmail),          // encrypted at rest
      EmailHash:  hashForLookup(rawEmail),    // deterministic hash for equality lookups
      Phone:      encrypt(rawPhone),          // encrypted at rest
      PhoneHash:  hashForLookup(rawPhone),    // deterministic hash for Twilio reply matching
      Service:    findField(row, 'service', 'services'),
      Notes:      findField(row, 'notes', 'note', 'comments'),
      AccountId:  accountId,
      Status:     'New',
      Source:     'CSV Upload',
      CreatedAt:  now,
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
