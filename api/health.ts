// FLOW: Returns environment configuration status for all integrations
// TRIGGER: GET /api/health (linked from MasterDashboard and MasterSettings)
// RETURNS: { ready: boolean, env: { [KEY]: { configured: boolean } } }
import type { VercelRequest, VercelResponse } from '@vercel/node'

const REQUIRED_ENV_VARS = [
  'STRIPE_SECRET_KEY',
  'TWILIO_ACCOUNT_SID',
  'AIRTABLE_API_KEY',
  'AIRTABLE_BASE_ID',
  'RESEND_API_KEY',
  'MAKE_WEBHOOK_URL',
] as const

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const checks: Record<string, { configured: boolean }> = {}
  let allConfigured = true

  for (const key of REQUIRED_ENV_VARS) {
    const configured = !!process.env[key]
    checks[key] = { configured }
    if (!configured) allConfigured = false
  }

  return res.status(200).json({
    ready: allConfigured,
    env: checks,
  })
}
