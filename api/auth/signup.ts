// POST /api/auth/signup
// Input: { email, password, first_name, last_name, company_name, phone }
// Flow: validate → hash password → create Airtable record (Tier: Free) → generate voicemail → return JWT
import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { signToken } from '../lib/jwt.js'
import { findByEmail, create, setVoicemailUrl } from '../lib/contractors.js'

async function generateVoicemail(firstName: string, lastName: string, companyName: string): Promise<string> {
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.NEXT_PUBLIC_URL || 'http://localhost:3000')

  const res = await fetch(`${base}/api/voicemail/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ first_name: firstName, last_name: lastName, company_name: companyName }),
  })
  if (!res.ok) return ''
  const data = await res.json() as { voicemail_url?: string }
  return data.voicemail_url || ''
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { email, password, first_name, last_name, company_name, phone } = body || {}

  if (!email || !password || !first_name || !last_name || !company_name) {
    return res.status(400).json({ error: 'email, password, first_name, last_name, and company_name are required' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  const existing = await findByEmail(email)
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const contractor = await create({
    email,
    passwordHash,
    firstName: first_name,
    lastName: last_name,
    companyName: company_name,
    phone: phone || '',
    voicemailUrl: '',
    tier: 'Free',
    createdAt: new Date().toISOString(),
  })

  // Generate voicemail async — don't fail signup if it errors
  const voicemailUrl = await generateVoicemail(first_name, last_name, company_name).catch(() => '')
  if (voicemailUrl) {
    await setVoicemailUrl(contractor.id, voicemailUrl).catch(() => {})
  }

  const token = await signToken({
    sub: contractor.id,
    email: contractor.email,
    firstName: contractor.firstName,
    lastName: contractor.lastName,
    company: contractor.companyName,
    tier: contractor.tier,
  })

  return res.status(201).json({
    contractor_id: contractor.id,
    email: contractor.email,
    voicemail_url: voicemailUrl,
    tier: contractor.tier,
    token,
  })
}
