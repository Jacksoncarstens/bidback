// FLOW: Customer selects plan → Stripe session created → redirect to checkout
// TRIGGER: POST /api/create-checkout from pricing page
// PLANS: ppa=$150/mo, pro=$400/mo, ent=$800/mo (price IDs from env)
// STRIPE INTEGRATION: Basic auth with STRIPE_SECRET_KEY, creates recurring subscription
// RETURNS: { url: "<stripe_checkout_session_url>" }
import type { VercelRequest, VercelResponse } from '@vercel/node'

type Plan = 'ppa' | 'pro' | 'ent'

const PRICE_ENV_MAP: Record<Plan, string> = {
  ppa: 'STRIPE_PRICE_PPA',
  pro: 'STRIPE_PRICE_PRO',
  ent: 'STRIPE_PRICE_ENT',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { STRIPE_SECRET_KEY } = process.env
  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { plan, email } = body || {}

  if (!plan || !(plan in PRICE_ENV_MAP)) {
    return res.status(400).json({ error: 'Invalid plan. Must be one of: ppa, pro, ent' })
  }

  const priceId = process.env[PRICE_ENV_MAP[plan as Plan]]
  if (!priceId) {
    return res.status(500).json({ error: `Price ID not configured for plan: ${plan}` })
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://leadly-lac.vercel.app'
  const credentials = Buffer.from(`${STRIPE_SECRET_KEY}:`).toString('base64')

  const params = new URLSearchParams({
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    mode: 'subscription',
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/?checkout=cancelled`,
  })

  if (email) params.set('customer_email', email)

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!stripeRes.ok) {
      const err = await stripeRes.json() as { error?: { message?: string } }
      return res.status(stripeRes.status).json({ error: err.error?.message || 'Stripe error' })
    }

    const session = await stripeRes.json() as { url: string }
    return res.status(200).json({ url: session.url })
  } catch {
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }
}
