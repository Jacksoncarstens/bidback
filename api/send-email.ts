// FLOW: Send email via Resend → Log event to Airtable
// TRIGGER: POST /api/send-email from Make.com or customer UI
// RESEND INTEGRATION: Bearer auth, sends from RESEND_FROM_EMAIL (support@bidback.io)
// AIRTABLE LOG: Records every email send (sent/failed) in Events table
// RETURNS: { success: true/false, id: "<resend_email_id>" }
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

  const { RESEND_API_KEY, RESEND_FROM_EMAIL } = process.env
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Resend API key not configured' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { leadId, to, subject, body: emailBody } = body || {}

  if (!to || !subject || !emailBody) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, body' })
  }

  const from = RESEND_FROM_EMAIL || 'leads@leadly.app'

  let success = false
  let emailId = ''
  let status = 'failed'

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html: emailBody }),
    })

    if (resendRes.ok) {
      const data = await resendRes.json() as { id: string }
      emailId = data.id
      success = true
      status = 'sent'
    } else {
      const err = await resendRes.json() as { message?: string }
      return res.status(resendRes.status).json({ success: false, error: err.message || 'Resend error' })
    }
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to reach Resend' })
  } finally {
    await logAirtableEvent({
      LeadId: leadId || '',
      Type: 'email_sent',
      Channel: 'Email',
      Message: subject,
      Status: status,
      Timestamp: new Date().toISOString(),
    })
  }

  return res.status(200).json({ success, id: emailId })
}
