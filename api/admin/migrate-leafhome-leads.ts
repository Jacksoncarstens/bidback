// POST /api/admin/migrate-account-leads
// ONE-TIME: Re-tags all leads with a given AccountId to a new AccountId (Airtable record ID)
// Protected by MIGRATION_SECRET env var (required)
// Usage: POST /api/admin/migrate-account-leads?secret=<MIGRATION_SECRET>
//        Body: { "oldAccountId": "OldName", "newAccountId": "rec..." }
// Returns: { updated: <count>, skipped: <count> }
import type { VercelRequest, VercelResponse } from '@vercel/node'

async function airtableFetch(path: string, options?: RequestInit): Promise<Response> {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) throw new Error('Airtable not configured')
  return fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const MIGRATION_SECRET = process.env.MIGRATION_SECRET
  if (!MIGRATION_SECRET) {
    return res.status(403).json({ error: 'MIGRATION_SECRET env var not set' })
  }
  const provided = req.query.secret as string
  if (provided !== MIGRATION_SECRET) {
    return res.status(401).json({ error: 'Unauthorized — provide ?secret=<MIGRATION_SECRET>' })
  }

  const OLD_ACCOUNT_ID = (req.body?.oldAccountId || req.query.oldAccountId) as string
  const NEW_ACCOUNT_ID = (req.body?.newAccountId || req.query.newAccountId) as string

  if (!OLD_ACCOUNT_ID || !NEW_ACCOUNT_ID) {
    return res.status(400).json({ error: 'Provide oldAccountId and newAccountId in body or query params' })
  }

  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable not configured' })
  }

  // Step 1: Fetch all leads with the old AccountId (paginated)
  const filter = encodeURIComponent(`{AccountId}="${OLD_ACCOUNT_ID}"`)
  let allRecords: { id: string }[] = []
  let offset: string | undefined

  do {
    const url = `/Leads?filterByFormula=${filter}&fields[]=AccountId&pageSize=100${offset ? `&offset=${offset}` : ''}`
    const response = await airtableFetch(url)
    if (!response.ok) {
      const err = await response.text()
      return res.status(500).json({ error: `Airtable fetch failed: ${err}` })
    }
    const data = await response.json() as { records: { id: string }[]; offset?: string }
    allRecords = allRecords.concat(data.records)
    offset = data.offset
  } while (offset)

  console.log(`[migrate-account-leads] Found ${allRecords.length} leads with AccountId="${OLD_ACCOUNT_ID}"`)

  if (allRecords.length === 0) {
    return res.status(200).json({ updated: 0, skipped: 0, message: 'No leads found to migrate' })
  }

  // Step 2: Batch update in groups of 10 (Airtable limit)
  let updated = 0
  const chunks: { id: string }[][] = []
  for (let i = 0; i < allRecords.length; i += 10) {
    chunks.push(allRecords.slice(i, i + 10))
  }

  for (const chunk of chunks) {
    const response = await airtableFetch('/Leads', {
      method: 'PATCH',
      body: JSON.stringify({
        records: chunk.map(r => ({ id: r.id, fields: { AccountId: NEW_ACCOUNT_ID } })),
      }),
    })
    if (response.ok) {
      const data = await response.json() as { records: { id: string }[] }
      updated += data.records?.length ?? 0
    } else {
      const err = await response.text()
      console.error(`[migrate-account-leads] Batch update failed:`, err)
    }
  }

  console.log(`[migrate-account-leads] Updated ${updated} of ${allRecords.length} leads`)

  return res.status(200).json({
    updated,
    total: allRecords.length,
    skipped: allRecords.length - updated,
    old_account_id: OLD_ACCOUNT_ID,
    new_account_id: NEW_ACCOUNT_ID,
  })
}
