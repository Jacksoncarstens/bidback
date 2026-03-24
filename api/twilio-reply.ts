// WEBHOOK: Receives inbound SMS from Twilio
// TRIGGER: Twilio posts to this endpoint when a lead replies
// REPLY PARSING:
//   "yes" / "interested" / "call me" / "yes please" → Status: "Interested", event: replied_yes
//   "no" / "not interested" / "stop" / "unsubscribe" → Status: "Not Interested", event: replied_no
//   anything else → log event, no status change (don't assume refusal, keep in sequence)
// AIRTABLE: Updates Lead Status + creates Events record
import type { VercelRequest, VercelResponse } from '@vercel/node'

// ── Intent detection ──────────────────────────────────────────────────────────
type ReplyIntent = 'yes' | 'no' | 'unknown'

function parseIntent(message: string): ReplyIntent {
  const text = message.toLowerCase().trim().replace(/[^a-z\s]/g, '')
  const yesPatterns = ['yes', 'interested', 'call me', 'yes please', 'sure', 'absolutely',
    'sounds good', 'i am interested', 'im interested', 'definitely', 'lets do it', 'let me know',
    'call back', 'please call', 'reach out']
  const noPatterns  = ['no', 'not interested', 'stop', 'unsubscribe', 'remove me', 'leave me alone',
    'do not contact', 'dont contact', 'no thanks', 'nope', 'not now', 'cancel']

  if (yesPatterns.some(p => text.includes(p))) return 'yes'
  if (noPatterns.some(p => text.includes(p)))  return 'no'
  return 'unknown'
}

// ── Airtable helpers ──────────────────────────────────────────────────────────
async function findLeadByPhone(phone: string): Promise<{ id: string; contractorId: string } | null> {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) return null

  const formula = encodeURIComponent(`{Phone}="${phone}"`)
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Leads?filterByFormula=${formula}&maxRecords=1&fields[]=AccountId`,
    { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
  )
  if (!res.ok) return null
  const data = await res.json() as { records: { id: string; fields: { AccountId?: string } }[] }
  const rec = data.records?.[0]
  if (!rec) return null
  return { id: rec.id, contractorId: rec.fields['AccountId'] || '' }
}

async function updateLeadStatus(recordId: string, status: string): Promise<void> {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) return
  await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Leads/${recordId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { Status: status } }),
  }).catch(() => {/* silent */})
}

async function createEvent(fields: Record<string, string | number>): Promise<void> {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) return
  await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  }).catch(() => {/* silent */})
}

async function triggerMakeWebhook(data: Record<string, unknown>): Promise<void> {
  const url = process.env.MAKE_WEBHOOK_URL
  if (!url) return
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {/* silent */})
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed')

  const body = typeof req.body === 'string'
    ? Object.fromEntries(new URLSearchParams(req.body))
    : req.body as Record<string, string>

  const from: string    = body['From']    || ''
  const message: string = body['Body']    || ''
  const now = new Date().toISOString()

  const intent = parseIntent(message)
  const lead = await findLeadByPhone(from)
  const leadId       = lead?.id           || ''
  const contractorId = lead?.contractorId || ''

  // Update lead status based on intent
  if (lead) {
    if (intent === 'yes') {
      await updateLeadStatus(lead.id, 'Interested')
    } else if (intent === 'no') {
      await updateLeadStatus(lead.id, 'Not Interested')
    }
    // unknown intent: log but leave status unchanged — keep in drip sequence
  }

  // Log to Events table using drip schema
  await createEvent({
    LeadId:       leadId,
    ContractorId: contractorId,
    ActionType:   'sms_initial',  // inbound reply — ActionType not used for reply events
    Status:       intent === 'yes' ? 'replied_yes' : intent === 'no' ? 'replied_no' : 'received',
    ReplyText:    message.slice(0, 500),
    Timestamp:    now,
    BatchNumber:  0,
  })

  // Notify Make.com for CRM routing (non-fatal)
  if (lead && intent !== 'unknown') {
    await triggerMakeWebhook({
      event:       intent === 'yes' ? 'lead.interested' : 'lead.not_interested',
      phone:       from,
      message,
      leadId,
      contractorId,
      intent,
    })
  }

  // Twilio expects TwiML response
  res.setHeader('Content-Type', 'text/xml')
  return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>')
}
