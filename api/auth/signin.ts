// POST /api/auth/signin
// Input: { email, password }
// Flow: find contractor by email → verify bcrypt hash → return JWT with tier
import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { signToken } from '../lib/jwt.js'
import { findByEmail } from '../lib/contractors.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { email, password } = body || {}

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' })
  }

  const contractor = await findByEmail(email)
  // Constant-time compare to prevent user-enumeration timing attacks
  const validHash = contractor?.passwordHash || '$2b$12$invalidhashpaddingtomakeconstanttime'
  const match = await bcrypt.compare(password, validHash)

  if (!contractor || !match) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  // Log contractor record to verify data before JWT creation
  console.log('[signin] contractor:', JSON.stringify({
    id: contractor.id, email: contractor.email,
    firstName: contractor.firstName, lastName: contractor.lastName,
    companyName: contractor.companyName, tier: contractor.tier,
  }))

  const token = await signToken({
    sub: contractor.id,
    email: contractor.email,
    firstName: contractor.firstName,
    lastName: contractor.lastName,
    company: contractor.companyName,
    tier: contractor.tier,
  })

  return res.status(200).json({
    contractor_id: contractor.id,
    email: contractor.email,
    firstName: contractor.firstName,
    lastName: contractor.lastName,
    companyName: contractor.companyName,
    voicemail_url: contractor.voicemailUrl,
    tier: contractor.tier,
    token,
  })
}
