// WEBHOOK: Handles inbound voice calls via Twilio
// TRIGGER: Twilio posts to this endpoint when a lead calls the tracking number
// ACTION: Returns TwiML with greeting and IVR menu (voicemail or live connect)
// AIRTABLE LOG: Records inbound call in CallLogs table
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed')
  }

  const body = typeof req.body === 'string'
    ? Object.fromEntries(new URLSearchParams(req.body))
    : req.body

  const callerNumber = body['From'] || 'Unknown'
  const agentName = process.env.AGENT_NAME || 'the team'
  const companyName = process.env.COMPANY_NAME || 'our company'

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">
    Hello! Thank you for calling ${companyName}.
    ${agentName} will be with you shortly.
    Please stay on the line.
  </Say>
  <Pause length="1"/>
  <Say voice="Polly.Joanna">
    You can also press 1 to leave a voicemail, or press 2 to be connected now.
  </Say>
  <Gather numDigits="1" action="/api/twilio-voice-menu" timeout="10">
  </Gather>
  <Say voice="Polly.Joanna">
    We did not receive your input. Goodbye!
  </Say>
  <Hangup/>
</Response>`

  // Log the inbound call to Airtable
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env
  if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
    fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/CallLogs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          CallerNumber: callerNumber,
          CallSid: body['CallSid'] || '',
          Direction: 'inbound',
          CreatedAt: new Date().toISOString(),
        },
      }),
    }).catch(() => {/* silent */})
  }

  res.setHeader('Content-Type', 'text/xml')
  return res.status(200).send(twiml)
}
