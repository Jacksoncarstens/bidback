// POST /api/voicemail/test
// Manual test endpoint — no auth required, but rate-limited by IP
// Rate limit: 5 test generations per IP per day
// Input: { first_name, last_name, company_name }
// Calls /api/voicemail/generate and returns the MP3 URL for listening
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { checkRateLimit, DAY_MS } from '../lib/rate-limit.js'
import generateHandler from './generate.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Rate limit by IP: 5 test generations per day
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() || 'unknown'
  const rl = checkRateLimit(`${ip}:voicemail_test:${new Date().toDateString()}`, 5, DAY_MS)
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(Math.ceil((rl.resetAt - Date.now()) / 1000)))
    return res.status(429).json({ error: 'Test voicemail rate limit reached (5/day per IP).' })
  }

  // Note: generate handler requires JWT — strip auth requirement for test endpoint
  // by injecting a bypass flag on the request
  ;(req as Record<string, unknown>)['_voicemail_test_bypass'] = true

  // Delegate to the generate handler — it reads the same req.body
  return generateHandler(req, res)
}
