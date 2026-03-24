// FLOW: Send SMS via Twilio → Log event to Airtable
// TRIGGER: POST /api/send-sms from Make.com or customer UI
// TWILIO INTEGRATION: Basic auth with TWILIO_ACCOUNT_SID:TWILIO_AUTH_TOKEN
// AIRTABLE LOG: Records every SMS attempt (sent/failed) in Events table
// RETURNS: { success: true/false, sid: "<twilio_message_id>" }
import type { VercelRequest, VercelResponse } from '@vercel/node'

async function logAirtableEvent(event: Record<string, string>) {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) return

  await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: event }),
  }).catch(() => {/* silent */})
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return res.status(500).json({ error: 'Twilio credentials not configured' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { leadId, to, message } = body || {}

  if (!to || !message) {
    return res.status(400).json({ error: 'Missing required fields: to, message' })
  }

  const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

  let success = false
  let sid = ''
  let status = 'failed'

  try {
    const twilioRes = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: TWILIO_PHONE_NUMBER,
        To: to,
        Body: message,
      }).toString(),
    })

    if (twilioRes.ok) {
      const data = await twilioRes.json() as { sid: string }
      sid = data.sid
      success = true
      status = 'sent'
    } else {
      const err = await twilioRes.json() as { message?: string }
      return res.status(twilioRes.status).json({ success: false, error: err.message || 'Twilio error' })
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to reach Twilio' })
  } finally {
    await logAirtableEvent({
      LeadId: leadId || '',
      Type: 'sms_sent',
      Channel: 'SMS',
      Message: message,
      Status: status,
      Timestamp: new Date().toISOString(),
    })
  }

  return res.status(200).json({ success, sid })
}
