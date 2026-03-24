// GET /api/admin/seed-example
// ONE-TIME endpoint — creates an example Pro account + generates voicemail
// Call once after deployment: visit /api/admin/seed-example?secret=<ADMIN_SEED_SECRET>
// Protected by ADMIN_SEED_SECRET env var (required — do not leave open in production)
import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { findByEmail, create, setVoicemailUrl, setTier } from '../lib/contractors.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Require secret protection — set ADMIN_SEED_SECRET in env vars before using
  const secret = process.env.ADMIN_SEED_SECRET
  if (!secret) {
    return res.status(403).json({ error: 'ADMIN_SEED_SECRET env var not set — configure before use' })
  }
  const provided = req.query.secret as string
  if (provided !== secret) {
    return res.status(403).json({ error: 'Forbidden — provide ?secret=<ADMIN_SEED_SECRET>' })
  }

  const EMAIL = process.env.SEED_EMAIL || ''
  const FIRST_NAME = process.env.SEED_FIRST_NAME || 'Demo'
  const LAST_NAME = process.env.SEED_LAST_NAME || 'User'
  const COMPANY = process.env.SEED_COMPANY || 'Example Company'
  const TIER = (process.env.SEED_TIER as 'Starter' | 'Pro' | 'Enterprise') || 'Pro'

  if (!EMAIL) {
    return res.status(400).json({ error: 'SEED_EMAIL env var not set' })
  }

  // Check if already exists
  const existing = await findByEmail(EMAIL)
  if (existing) {
    await setTier(existing.id, TIER)
    return res.status(200).json({
      status: 'already_exists',
      message: `Account already exists — tier updated to ${TIER}`,
      contractor_id: existing.id,
      email: existing.email,
      tier: TIER,
    })
  }

  // Generate a random initial password — contractor should reset via email
  const tempPassword = `bb-${Math.random().toString(16).slice(2, 10)}`
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  const contractor = await create({
    email: EMAIL,
    passwordHash,
    firstName: FIRST_NAME,
    lastName: LAST_NAME,
    companyName: COMPANY,
    phone: '',
    voicemailUrl: '',
    tier: TIER,
    createdAt: new Date().toISOString(),
  })

  // Generate voicemail
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.NEXT_PUBLIC_URL || 'http://localhost:3000')

  let voicemailUrl = ''
  try {
    const vmRes = await fetch(`${base}/api/voicemail/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: FIRST_NAME, last_name: LAST_NAME, company_name: COMPANY }),
    })
    if (vmRes.ok) {
      const vmData = await vmRes.json() as { voicemail_url?: string }
      voicemailUrl = vmData.voicemail_url || ''
      if (voicemailUrl) await setVoicemailUrl(contractor.id, voicemailUrl)
    }
  } catch { /* non-fatal */ }

  return res.status(201).json({
    status: 'created',
    contractor_id: contractor.id,
    email: contractor.email,
    tier: TIER,
    voicemail_url: voicemailUrl,
    note: 'Temporary password generated — share securely or trigger password reset',
  })
}
