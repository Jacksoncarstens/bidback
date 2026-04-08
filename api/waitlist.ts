import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, name } = req.body ?? {}

  if (!email || !name) return res.status(400).json({ error: 'Missing required fields' })

  const apiKey = process.env.AIRTABLE_API_KEY
  const baseId = process.env.AIRTABLE_BASE_ID

  if (!apiKey || !baseId) return res.status(500).json({ error: 'Server configuration error' })

  const response = await fetch(`https://api.airtable.com/v0/${baseId}/Waitlist`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        email: String(email).trim().toLowerCase(),
        name: String(name).trim(),
        date_submitted: new Date().toISOString(),
        status: 'pending',
      },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    if (err.includes('ROW_DOES_NOT_EXIST') || err.includes('duplicate') || err.includes('INVALID_VALUE_FOR_COLUMN')) {
      return res.status(409).json({ error: 'Email already on list' })
    }
    console.error('Airtable waitlist error:', err)
    return res.status(500).json({ error: 'Failed to save' })
  }

  return res.status(200).json({ success: true })
}
