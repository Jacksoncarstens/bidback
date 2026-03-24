// POST /api/voicemail/test
// Manual test endpoint — no auth required
// Input: { first_name, last_name, company_name }
// Calls /api/voicemail/generate and returns the MP3 URL for listening
import type { VercelRequest, VercelResponse } from '@vercel/node'
import generateHandler from './generate.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Delegate to the generate handler — it reads the same req.body
  return generateHandler(req, res)
}
