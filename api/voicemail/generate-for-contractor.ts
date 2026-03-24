// POST /api/voicemail/generate-for-contractor
// Input: { email } or { contractor_id } + optional { first_name, last_name, company_name } overrides
// Inlines ElevenLabs TTS + Vercel Blob — no dependency on other API endpoints
// Protected by ?secret=migration-2026
// Returns: { contractor_id, email, voicemail_url }
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'
import { findByEmail, setVoicemailUrl } from '../lib/contractors.js'

// ── Gender detection ──────────────────────────────────────────────────────────
const MALE_NAMES = new Set([
  'james','john','robert','michael','william','david','richard','joseph','thomas','charles',
  'christopher','daniel','matthew','anthony','donald','mark','paul','steven','andrew','kenneth',
  'george','joshua','kevin','brian','edward','ronald','timothy','jason','jeffrey','ryan',
  'jacob','gary','nicholas','eric','jonathan','stephen','larry','justin','scott','brandon',
  'benjamin','samuel','gregory','frank','raymond','patrick','alexander','jack','dennis','jerry',
  'tyler','aaron','henry','jose','adam','douglas','nathan','peter','zachary','kyle','walter',
  'harold','jeremy','ethan','christian','arthur','terry','roger','sean','keith','austin',
  'joe','noah','jesse','albert','bryan','billy','bruce','willie','jordan','dylan','ralph',
  'alan','juan','wayne','gabriel','louis','russell','randy','mason','liam','oliver',
  'elijah','logan','caleb','owen','hunter','jake','mike','dave','tom','bob','jim','rick',
  'brad','chad','lance','drew','brett','cody','travis','derek','curt','clint','wade',
  'blake','shane','troy','clay','corey','dustin','brent','zach','zack','tanner','colton',
])

function detectGender(firstName: string): 'male' | 'female' {
  return MALE_NAMES.has(firstName.trim().toLowerCase()) ? 'male' : 'female'
}

// ── Contractor lookup by Airtable record ID ───────────────────────────────────
async function findById(id: string): Promise<import('../lib/contractors.js').Contractor | null> {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) return null
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Contractors/${id}`, {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
  })
  if (!res.ok) return null
  const rec = await res.json() as { id: string; fields: Record<string, string> }
  return {
    id:           rec.id,
    email:        rec.fields['Email']        || '',
    passwordHash: rec.fields['PasswordHash'] || '',
    firstName:    rec.fields['FirstName']    || '',
    lastName:     rec.fields['LastName']     || '',
    companyName:  rec.fields['CompanyName']  || '',
    phone:        rec.fields['Phone']        || '',
    voicemailUrl: rec.fields['VoicemailUrl'] || '',
    tier:         rec.fields['Tier']         || 'Free',
    createdAt:    rec.fields['CreatedAt']    || '',
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'migration-2026'
  const ADMIN_SECRET = process.env.ADMIN_SEED_SECRET
  const provided = req.query.secret as string
  if (provided !== MIGRATION_SECRET && (!ADMIN_SECRET || provided !== ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized — provide ?secret=migration-2026' })
  }

  const { ELEVENLABS_API_KEY, ELEVENLABS_VOICE_MALE, ELEVENLABS_VOICE_FEMALE } = process.env
  if (!ELEVENLABS_API_KEY) return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
  const { email, contractor_id, first_name, last_name, company_name } = body as Record<string, string>

  if (!email && !contractor_id) {
    return res.status(400).json({ error: 'Provide email or contractor_id' })
  }

  // Look up contractor
  const contractor = contractor_id ? await findById(contractor_id) : await findByEmail(email)
  if (!contractor) return res.status(404).json({ error: 'Contractor not found' })

  const firstName   = first_name   || contractor.firstName
  const lastName    = last_name    || contractor.lastName
  const companyName = company_name || contractor.companyName

  // Build TTS script
  const script  = `Hi, this is ${firstName} ${lastName} with ${companyName}. I'm following up on that project we discussed previously. If you're still interested or if anything has changed, give me a call back. Thanks!`
  const gender  = detectGender(firstName)
  const voiceId = gender === 'female'
    ? (ELEVENLABS_VOICE_FEMALE || 'FLj50PrMa40MhGHappOt')
    : (ELEVENLABS_VOICE_MALE   || 'tMvyQtpCVQ0DkixuYm6J')

  // Call ElevenLabs directly
  const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: script,
      model_id: 'eleven_monolingual_v1',
      voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.1, use_speaker_boost: true },
    }),
  })

  if (!ttsRes.ok) {
    const errText = await ttsRes.text()
    return res.status(ttsRes.status).json({ error: `ElevenLabs error: ${errText}` })
  }

  // Upload MP3 to Vercel Blob
  const audioBuffer = Buffer.from(await ttsRes.arrayBuffer())
  const slug        = companyName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
  const filename    = `voicemails/${slug}-${Date.now()}.mp3`
  const blob        = await put(filename, audioBuffer, { access: 'public', contentType: 'audio/mpeg' })

  // Save URL back to contractor record
  await setVoicemailUrl(contractor.id, blob.url)

  return res.status(200).json({
    contractor_id: contractor.id,
    email: contractor.email,
    firstName,
    lastName,
    companyName,
    voicemail_url: blob.url,
  })
}
