// CRON: Daily at 9 AM CDT (14:00 UTC) — POST /api/cron/drip-sequence
// Vercel cron triggers this via vercel.json schedule
// STOP window: 7 PM CDT (19:00 CDT / 00:00 UTC) — skip all sends
//
// FLOW per contractor (paid tier only):
//   1. Fetch all leads for contractor, sort by CreatedAt, split into 5 batches (20% each)
//   2. Calculate sequence day from earliest lead upload date
//   3. Look up which actions fire today per tier (Starter/Pro/Enterprise)
//   4. Fetch Events to find replied leads + already-sent action types
//   5. Filter batch → skip replied leads where required, skip already-sent actions
//   6. Log to Airtable Events (MOCKED — no actual Twilio/Make.com calls yet)
//   7. Update Lead Status to "Contacted"
//
// SEQUENCES:
//   Starter  (6 days)  — SMS only
//   Pro      (7 days)  — SMS + Voicemail
//   Enterprise (8 days) — SMS + Email + Voicemail

import type { VercelRequest, VercelResponse } from '@vercel/node'

// ── Types ─────────────────────────────────────────────────────────────────────
type Tier = 'Starter' | 'Pro' | 'Enterprise'
type ActionType = 'sms_initial' | 'sms_followup' | 'email' | 'voicemail'

interface DripAction {
  batchNum: number        // 1-5
  actionType: ActionType
  requireNoReply: boolean // if true: skip leads that have replied yes/no
}

interface Lead {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  status: string
  createdAt: string
}

interface Contractor {
  id: string
  email: string
  firstName: string
  lastName: string
  companyName: string
  voicemailUrl: string
  tier: Tier
}

interface Event {
  leadId: string
  contractorId: string
  actionType: ActionType
  status: string  // queued | sent | failed | replied_yes | replied_no
  batchNumber: number
}

// ── Drip sequences per tier ───────────────────────────────────────────────────
const SEQUENCES: Record<Tier, DripAction[][]> = {
  Starter: [
    // Day 1
    [{ batchNum: 1, actionType: 'sms_initial',  requireNoReply: false }],
    // Day 2
    [{ batchNum: 2, actionType: 'sms_initial',  requireNoReply: false }],
    // Day 3
    [{ batchNum: 3, actionType: 'sms_initial',  requireNoReply: false },
     { batchNum: 1, actionType: 'sms_followup', requireNoReply: true  }],
    // Day 4
    [{ batchNum: 4, actionType: 'sms_initial',  requireNoReply: false },
     { batchNum: 2, actionType: 'sms_followup', requireNoReply: true  }],
    // Day 5
    [{ batchNum: 5, actionType: 'sms_initial',  requireNoReply: false },
     { batchNum: 3, actionType: 'sms_followup', requireNoReply: true  }],
    // Day 6
    [{ batchNum: 4, actionType: 'sms_followup', requireNoReply: true  },
     { batchNum: 5, actionType: 'sms_followup', requireNoReply: true  }],
  ],
  Pro: [
    // Day 1
    [{ batchNum: 1, actionType: 'sms_initial',  requireNoReply: false }],
    // Day 2
    [{ batchNum: 1, actionType: 'voicemail',    requireNoReply: true  },
     { batchNum: 2, actionType: 'sms_initial',  requireNoReply: false }],
    // Day 3
    [{ batchNum: 2, actionType: 'voicemail',    requireNoReply: true  },
     { batchNum: 3, actionType: 'sms_initial',  requireNoReply: false }],
    // Day 4
    [{ batchNum: 3, actionType: 'voicemail',    requireNoReply: true  },
     { batchNum: 4, actionType: 'sms_initial',  requireNoReply: false }],
    // Day 5
    [{ batchNum: 4, actionType: 'voicemail',    requireNoReply: true  },
     { batchNum: 5, actionType: 'sms_initial',  requireNoReply: false }],
    // Day 6
    [{ batchNum: 5, actionType: 'voicemail',    requireNoReply: true  }],
    // Day 7 — follow-up SMS all batches
    [1,2,3,4,5].map(b => ({ batchNum: b, actionType: 'sms_followup' as ActionType, requireNoReply: true })),
  ],
  Enterprise: [
    // Day 1
    [{ batchNum: 1, actionType: 'sms_initial',  requireNoReply: false }],
    // Day 2
    [{ batchNum: 2, actionType: 'sms_initial',  requireNoReply: false }],
    // Day 3
    [{ batchNum: 1, actionType: 'email',        requireNoReply: true  },
     { batchNum: 1, actionType: 'voicemail',    requireNoReply: true  },
     { batchNum: 3, actionType: 'sms_initial',  requireNoReply: false }],
    // Day 4
    [{ batchNum: 2, actionType: 'email',        requireNoReply: true  },
     { batchNum: 2, actionType: 'voicemail',    requireNoReply: true  },
     { batchNum: 4, actionType: 'sms_initial',  requireNoReply: false }],
    // Day 5
    [{ batchNum: 3, actionType: 'email',        requireNoReply: true  },
     { batchNum: 3, actionType: 'voicemail',    requireNoReply: true  },
     { batchNum: 5, actionType: 'sms_initial',  requireNoReply: false }],
    // Day 6
    [{ batchNum: 4, actionType: 'email',        requireNoReply: true  },
     { batchNum: 4, actionType: 'voicemail',    requireNoReply: true  }],
    // Day 7
    [{ batchNum: 5, actionType: 'email',        requireNoReply: true  },
     { batchNum: 5, actionType: 'voicemail',    requireNoReply: true  }],
    // Day 8 — follow-up SMS + EMAIL all batches
    [
      ...[1,2,3,4,5].map(b => ({ batchNum: b, actionType: 'sms_followup' as ActionType, requireNoReply: true })),
      ...[1,2,3,4,5].map(b => ({ batchNum: b, actionType: 'email'        as ActionType, requireNoReply: true })),
    ],
  ],
}

// ── Airtable helpers ──────────────────────────────────────────────────────────
async function atFetch(path: string, options?: RequestInit): Promise<Response> {
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

async function fetchAllPages<T>(path: string): Promise<T[]> {
  let all: T[] = []
  let offset: string | undefined
  do {
    const sep = path.includes('?') ? '&' : '?'
    const url = `${path}${offset ? `${sep}offset=${offset}` : ''}`
    const res = await atFetch(url)
    if (!res.ok) break
    const data = await res.json() as { records: T[]; offset?: string }
    all = all.concat(data.records)
    offset = data.offset
  } while (offset)
  return all
}

async function fetchPaidContractors(): Promise<Contractor[]> {
  type Rec = { id: string; fields: Record<string, string> }
  const formula = encodeURIComponent(`OR({Tier}="Starter",{Tier}="Pro",{Tier}="Enterprise")`)
  const records = await fetchAllPages<Rec>(`/Contractors?filterByFormula=${formula}&pageSize=100`)
  return records.map(r => ({
    id:           r.id,
    email:        r.fields['Email']        || '',
    firstName:    r.fields['FirstName']    || '',
    lastName:     r.fields['LastName']     || '',
    companyName:  r.fields['CompanyName']  || '',
    voicemailUrl: r.fields['VoicemailUrl'] || '',
    tier:         (r.fields['Tier'] || 'Starter') as Tier,
  }))
}

async function fetchLeadsForContractor(contractorId: string): Promise<Lead[]> {
  type Rec = { id: string; fields: Record<string, string> }
  const formula = encodeURIComponent(`{AccountId}="${contractorId}"`)
  const records = await fetchAllPages<Rec>(`/Leads?filterByFormula=${formula}&sort[0][field]=CreatedAt&sort[0][direction]=asc&pageSize=100`)
  return records.map(r => ({
    id:        r.id,
    firstName: r.fields['FirstName'] || '',
    lastName:  r.fields['LastName']  || '',
    phone:     r.fields['Phone']     || '',
    email:     r.fields['Email']     || '',
    status:    r.fields['Status']    || 'New',
    createdAt: r.fields['CreatedAt'] || '',
  }))
}

async function fetchEventsForContractor(contractorId: string): Promise<Event[]> {
  type Rec = { id: string; fields: Record<string, string | number> }
  const formula = encodeURIComponent(`{ContractorId}="${contractorId}"`)
  const records = await fetchAllPages<Rec>(`/Events?filterByFormula=${formula}&pageSize=100`)
  return records.map(r => ({
    leadId:       String(r.fields['LeadId']      || ''),
    contractorId: String(r.fields['ContractorId']|| ''),
    actionType:   String(r.fields['ActionType']  || '') as ActionType,
    status:       String(r.fields['Status']      || ''),
    batchNumber:  Number(r.fields['BatchNumber'] || 0),
  }))
}

async function batchCreateEvents(events: Record<string, unknown>[]): Promise<void> {
  // Airtable batch POST: up to 10 records per request
  for (let i = 0; i < events.length; i += 10) {
    const chunk = events.slice(i, i + 10)
    await atFetch('/Events', {
      method: 'POST',
      body: JSON.stringify({ records: chunk.map(fields => ({ fields })) }),
    }).catch(e => console.error('[drip] batchCreateEvents error:', e))
  }
}

async function batchUpdateLeadStatus(leadIds: string[], status: string): Promise<void> {
  for (let i = 0; i < leadIds.length; i += 10) {
    const chunk = leadIds.slice(i, i + 10)
    await atFetch('/Leads', {
      method: 'PATCH',
      body: JSON.stringify({ records: chunk.map(id => ({ id, fields: { Status: status } })) }),
    }).catch(e => console.error('[drip] batchUpdateLeadStatus error:', e))
  }
}

// ── Sequence day calculation ───────────────────────────────────────────────────
// Day 1 = day leads were first uploaded; day 2 = the next day, etc.
function getSequenceDay(leads: Lead[]): number {
  const datesWithCreatedAt = leads.filter(l => l.createdAt)
  if (datesWithCreatedAt.length === 0) return 0
  const earliest = new Date(datesWithCreatedAt[0].createdAt)
  // Use CDT midnight (UTC-5) as day boundary
  const nowUtc = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  return Math.floor((nowUtc - earliest.getTime()) / dayMs) + 1
}

// ── Batch assignment ──────────────────────────────────────────────────────────
// batchSize = ceil(totalLeads / 5) = 20% of total leads
// leads[i] → batch floor(i / batchSize) + 1, capped at 5
function assignBatches(leads: Lead[]): Map<number, Lead[]> {
  const total = leads.length
  if (total === 0) return new Map()
  const batchSize = Math.ceil(total / 5)
  const batches = new Map<number, Lead[]>()
  for (let b = 1; b <= 5; b++) batches.set(b, [])
  leads.forEach((lead, i) => {
    const bNum = Math.min(Math.floor(i / batchSize) + 1, 5)
    batches.get(bNum)!.push(lead)
  })
  return batches
}

// ── CDT time check ────────────────────────────────────────────────────────────
// CDT = UTC - 5. Stop sends at 19:00 CDT = 00:00 UTC
function cdtHour(): number {
  return (new Date().getUTCHours() - 5 + 24) % 24
}

// ── Process one contractor ────────────────────────────────────────────────────
async function processContractor(contractor: Contractor, now: string): Promise<{
  contractorId: string; day: number; actionsQueued: number; skipped: string
}> {
  const leads = await fetchLeadsForContractor(contractor.id)
  if (leads.length === 0) return { contractorId: contractor.id, day: 0, actionsQueued: 0, skipped: 'no leads' }

  const day = getSequenceDay(leads)
  const sequence = SEQUENCES[contractor.tier]
  if (!sequence || day < 1 || day > sequence.length) {
    return { contractorId: contractor.id, day, actionsQueued: 0, skipped: `day ${day} out of sequence range` }
  }

  const todayPlan = sequence[day - 1]
  if (!todayPlan || todayPlan.length === 0) {
    return { contractorId: contractor.id, day, actionsQueued: 0, skipped: 'no actions for today' }
  }

  // Fetch existing events to build lookup maps
  const events = await fetchEventsForContractor(contractor.id)
  const repliedLeads = new Set<string>()
  const sentActions = new Set<string>() // "leadId|actionType"

  for (const ev of events) {
    if (ev.status === 'replied_yes' || ev.status === 'replied_no') repliedLeads.add(ev.leadId)
    if (ev.status === 'queued' || ev.status === 'sent') sentActions.add(`${ev.leadId}|${ev.actionType}`)
  }

  const batches = assignBatches(leads)
  const eventsToCreate: Record<string, unknown>[] = []
  const leadsToMarkContacted = new Set<string>()

  for (const action of todayPlan) {
    const batchLeads = batches.get(action.batchNum) || []
    const eligible = batchLeads.filter(lead => {
      if (sentActions.has(`${lead.id}|${action.actionType}`)) return false // already sent
      if (action.requireNoReply && repliedLeads.has(lead.id)) return false // replied — skip
      return true
    })

    for (const lead of eligible) {
      eventsToCreate.push({
        LeadId:       lead.id,
        ContractorId: contractor.id,
        ActionType:   action.actionType,
        Status:       'queued',     // MOCKED — will be 'sent' once Twilio is wired
        ReplyText:    '',
        Timestamp:    now,
        BatchNumber:  action.batchNum,
      })
      if (action.actionType === 'sms_initial' || action.actionType === 'sms_followup') {
        leadsToMarkContacted.add(lead.id)
      }
    }
  }

  if (eventsToCreate.length > 0) {
    await batchCreateEvents(eventsToCreate)
  }
  if (leadsToMarkContacted.size > 0) {
    await batchUpdateLeadStatus([...leadsToMarkContacted], 'Contacted')
  }

  console.log(`[drip] contractor=${contractor.id} tier=${contractor.tier} day=${day} queued=${eventsToCreate.length}`)
  return { contractorId: contractor.id, day, actionsQueued: eventsToCreate.length, skipped: '' }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify Vercel cron secret header or allow manual trigger with secret param
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers['authorization']
  const querySecret = req.query.secret as string | undefined
  if (cronSecret) {
    const bearerMatch = authHeader === `Bearer ${cronSecret}`
    const queryMatch  = querySecret === cronSecret
    if (!bearerMatch && !queryMatch) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  // CDT time check — stop all sends at 7 PM CDT
  const hour = cdtHour()
  if (hour >= 19) {
    console.log(`[drip] skipping — CDT hour is ${hour} (after 7 PM)`)
    return res.status(200).json({ skipped: true, reason: `After 7 PM CDT (hour=${hour})` })
  }

  const now = new Date().toISOString()
  console.log(`[drip] starting at ${now} CDT hour=${hour}`)

  let contractors: Contractor[]
  try {
    contractors = await fetchPaidContractors()
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }

  console.log(`[drip] processing ${contractors.length} paid contractors`)

  const results = await Promise.allSettled(
    contractors.map(c => processContractor(c, now))
  )

  const summary = results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { contractorId: contractors[i].id, error: String((r as PromiseRejectedResult).reason) }
  )

  return res.status(200).json({
    ran_at: now,
    cdt_hour: hour,
    contractors_processed: contractors.length,
    summary,
  })
}
