// FLOW: Frontend request → Airtable API → normalized lead array
// TRIGGER: GET /api/get-all-leads (master portal - no filter)
// PAGINATION: Handles 100 records/page, continues with offset
// RETURNS: { leads: [...], count: <number> }
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) return res.status(500).json({ error: 'Airtable not configured' })

  let allRecords: Array<{ id: string; fields: Record<string, unknown> }> = []
  let offset: string | undefined

  do {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Leads?pageSize=100${offset ? `&offset=${offset}` : ''}`
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    })
    if (!response.ok) return res.status(500).json({ error: 'Airtable fetch failed' })
    const data = await response.json() as { records: Array<{ id: string; fields: Record<string, unknown> }>; offset?: string }
    allRecords = allRecords.concat(data.records)
    offset = data.offset
  } while (offset)

  const leads = allRecords.map(r => ({
    id: r.id,
    accountId: r.fields.AccountId || '',
    firstName: r.fields.FirstName || '',
    lastName: r.fields.LastName || '',
    phone: r.fields.Phone || '',
    email: r.fields.Email || '',
    status: r.fields.Status || 'New',
    source: r.fields.Source || '',
    service: r.fields.Service || '',
    city: r.fields.City || '',
    notes: r.fields.Notes || '',
    followUpDate: r.fields.FollowUpDate || '',
    createdAt: r.fields.CreatedAt || r.fields['Created'] || '',
  }))

  return res.status(200).json({ leads, count: leads.length })
}
