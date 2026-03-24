// WEBHOOK: Receives subscription events from Stripe
// TRIGGER: Stripe posts to this endpoint when a subscription event occurs
// ACTION: Update customer account status in Airtable based on payment events
// AIRTABLE LOG: Records billing events in Events table
import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'

function verifyStripeSignature(payload: string, signature: string, secret: string): boolean {
  const parts = Object.fromEntries(signature.split(',').map(p => p.split('=')))
  const timestamp = parts['t']
  const sigHash = parts['v1']
  if (!timestamp || !sigHash) return false
  const signed = `${timestamp}.${payload}`
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sigHash))
}

async function updateContractorTier(email: string, tier: string) {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) return
  const formula = encodeURIComponent(`LOWER({Email})="${email.toLowerCase()}"`)
  const search = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Contractors?filterByFormula=${formula}&maxRecords=1`,
    { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
  )
  if (!search.ok) return
  const data = await search.json() as { records: { id: string }[] }
  const id = data.records?.[0]?.id
  if (!id) return
  await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Contractors/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { Tier: tier } }),
  })
}

async function createAirtableRecord(data: Record<string, unknown>) {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) return
  await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Payments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: data }),
  })
}

function generatePortalPassword(email: string): string {
  // Simple deterministic password from email — change to random + store in Airtable for production
  const hash = crypto.createHmac('sha256', 'bidback-portal-salt-2026').update(email).digest('hex')
  return 'bb-' + hash.slice(0, 8)
}

async function sendWelcomeEmail(email: string, name: string, plan: string) {
  const { RESEND_API_KEY } = process.env
  if (!RESEND_API_KEY) return

  const password = generatePortalPassword(email)
  const portalUrl = 'https://bidback.io/signin'

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #111;">
      <img src="https://bidback.io/favicon.png" alt="BidBack" style="height: 48px; margin-bottom: 24px;" />
      <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px;">You're in. Let's go get those jobs back.</h1>
      <p style="color: #555; font-size: 16px; margin-bottom: 24px;">Hey ${name || 'there'} — you just signed up for BidBack <strong>${plan}</strong>. Here's everything you need to get started.</p>

      <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="font-weight: 700; margin: 0 0 8px;">Your portal login:</p>
        <p style="margin: 0 0 4px;">URL: <a href="${portalUrl}" style="color: #1e3a8a;">${portalUrl}</a></p>
        <p style="margin: 0 0 4px;">Email: <strong>${email}</strong></p>
        <p style="margin: 0;">Password: <strong style="font-family: monospace; background: #e9ecef; padding: 2px 6px; border-radius: 4px;">${password}</strong></p>
      </div>

      <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="font-weight: 700; margin: 0 0 12px;">Your first move: Upload your lead list</p>
        <ol style="margin: 0; padding-left: 20px; color: #555; line-height: 1.8;">
          <li>Log into your portal at <a href="${portalUrl}" style="color: #1e3a8a;">bidback.io/signin</a></li>
          <li>Click <strong>Upload Leads</strong> in the sidebar</li>
          <li>Upload a CSV with your old leads (name, phone, email)</li>
          <li>We reach out to all of them within seconds</li>
        </ol>
      </div>

      <p style="color: #555; font-size: 14px;">Most contractors recover 10-20 jobs from their first upload. You've already paid for months of BidBack with one job.</p>

      <p style="color: #555; font-size: 14px; margin-top: 24px;">Questions? Just reply to this email.</p>

      <p style="margin-top: 32px; color: #888; font-size: 12px;">BidBack · support@bidback.io · <a href="https://bidback.io" style="color: #888;">bidback.io</a></p>
    </div>
  `

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'BidBack <support@bidback.io>',
      to: email,
      subject: "You're in — here's your BidBack portal login",
      html,
    }),
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const signature = req.headers['stripe-signature'] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) return res.status(500).json({ error: 'Webhook secret not configured' })

  let rawBody: string
  try {
    rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
  } catch {
    return res.status(400).json({ error: 'Invalid body' })
  }

  if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
    return res.status(400).json({ error: 'Invalid signature' })
  }

  let event: { type: string; data: { object: Record<string, unknown> } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const email = session['customer_email'] as string || ''
      const name = (session['customer_details'] as Record<string, unknown>)?.['name'] as string || ''
      const amount = ((session['amount_total'] as number) / 100).toFixed(2)

      // Determine plan from amount
      const planMap: Record<string, string> = { '150.00': 'Starter', '400.00': 'Pro', '800.00': 'Enterprise' }
      const plan = planMap[amount] || 'Starter'

      await createAirtableRecord({
        Event: 'checkout.session.completed',
        Customer: email,
        Name: name,
        Plan: plan,
        Amount: amount,
        Currency: (session['currency'] as string || '').toUpperCase(),
        StripeSessionId: session['id'] as string,
        CreatedAt: new Date().toISOString(),
      })

      // Upgrade contractor tier in Contractors table
      if (email) {
        await updateContractorTier(email, plan)
        await sendWelcomeEmail(email, name, plan)
      }
      break
    }
    case 'customer.subscription.deleted': {
      // Subscription cancelled — revert to Free
      const sub = event.data.object
      const custEmail = sub['customer_email'] as string || ''
      await createAirtableRecord({
        Event: event.type,
        SubscriptionId: sub['id'] as string,
        Status: sub['status'] as string,
        Customer: sub['customer'] as string,
        CreatedAt: new Date().toISOString(),
      })
      if (custEmail) await updateContractorTier(custEmail, 'Free')
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object
      await createAirtableRecord({
        Event: event.type,
        SubscriptionId: sub['id'] as string,
        Status: sub['status'] as string,
        Customer: sub['customer'] as string,
        CreatedAt: new Date().toISOString(),
      })
      break
    }
    default:
      break
  }

  return res.status(200).json({ received: true })
}
