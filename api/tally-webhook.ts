// WEBHOOK: Receives form submission events from Tally.so
// TRIGGER: Tally posts to this endpoint when a new form is submitted
// ACTION: Create new lead record in Airtable, trigger Make.com automation
// AIRTABLE LOG: Records form intake event in Events table
import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

interface TallyField {
  key: string
  label: string
  type: string
  value: unknown
}

interface TallyPayload {
  eventId: string
  eventType: string
  createdAt: string
  data: {
    responseId: string
    submittedAt: string
    formId: string
    formName: string
    fields: TallyField[]
  }
}

function getFieldValue(fields: TallyField[], ...keys: string[]): string {
  for (const key of keys) {
    const field = fields.find(
      f => f.key.toLowerCase() === key.toLowerCase() || f.label.toLowerCase().includes(key.toLowerCase())
    )
    if (field && field.value != null) return String(field.value)
  }
  return ''
}

async function createAirtableLead(lead: Record<string, string>) {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = process.env
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) return null

  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME || 'Leads'}`, {
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

async function notifySlack(text: string) {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify Tally signature if secret configured
  const tallySecret = process.env.TALLY_WEBHOOK_SECRET
  if (tallySecret) {
    const signature = req.headers['tally-signature'] as string
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    const expected = crypto.createHmac('sha256', tallySecret).update(rawBody).digest('hex')
    if (signature !== expected) {
      return res.status(401).json({ error: 'Invalid signature' })
    }
  }

  let payload: TallyPayload
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  if (payload.eventType !== 'FORM_RESPONSE') {
    return res.status(200).json({ received: true, skipped: true })
  }

  const { fields } = payload.data

  const lead = {
    FirstName: getFieldValue(fields, 'first_name', 'firstname', 'first name', 'name'),
    LastName: getFieldValue(fields, 'last_name', 'lastname', 'last name'),
    Email: getFieldValue(fields, 'email', 'email address'),
    Phone: getFieldValue(fields, 'phone', 'phone number', 'mobile'),
    Service: getFieldValue(fields, 'service', 'interested_in', 'interest', 'looking for'),
    Source: 'Tally Form',
    Status: 'New',
    FormId: payload.data.formId,
    FormName: payload.data.formName,
    SubmittedAt: payload.data.submittedAt,
    TallyResponseId: payload.data.responseId,
  }

  // Create Airtable record
  const airtableRecord = await createAirtableLead(lead)

  // Trigger Make.com webhook
  await triggerMakeWebhook({
    event: 'lead.created',
    source: 'tally',
    lead,
    airtableId: airtableRecord?.id,
  })

  // Notify Slack
  const name = [lead.FirstName, lead.LastName].filter(Boolean).join(' ') || 'Unknown'
  await notifySlack(`🆕 New lead from Tally: *${name}* (${lead.Email || lead.Phone || 'no contact'}) — ${lead.Service || 'service not specified'}`)

  return res.status(200).json({ received: true, leadCreated: !!airtableRecord })
}
