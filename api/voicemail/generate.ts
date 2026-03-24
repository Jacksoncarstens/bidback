// POST /api/voicemail/generate
// Input: { first_name, last_name, company_name }
// Detects gender from first_name → picks ElevenLabs voice → generates MP3 → stores in Vercel Blob
// Logs record to Airtable "Voicemails" table
// Returns: { voicemail_url, generated_at, status: "success" }
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'

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

function buildScript(firstName: string, lastName: string, company: string): string {
  return `Hi, this is ${firstName} ${lastName} with ${company}. I'm following up on that project we discussed previously. If you're still interested or if anything has changed, give me a call back. Thanks!`
}

async function logToAirtable(data: { firstName: string; lastName: string; company: string; voicemailUrl: string; generatedAt: string }) {
  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) return

  await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Voicemails`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        Name: `${data.firstName} ${data.lastName}`,
        Company: data.company,
        VoicemailUrl: data.voicemailUrl,
        GeneratedAt: data.generatedAt,
      },
    }),
  }).catch(() => {/* non-fatal — blob already saved */})
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { ELEVENLABS_API_KEY, ELEVENLABS_VOICE_MALE, ELEVENLABS_VOICE_FEMALE } = process.env
  if (!ELEVENLABS_API_KEY) return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { first_name, last_name, company_name } = body || {}

  if (!first_name || !last_name || !company_name) {
    return res.status(400).json({ error: 'first_name, last_name, and company_name are required' })
  }

  const gender   = detectGender(first_name)
  const voiceId  = gender === 'female'
    ? (ELEVENLABS_VOICE_FEMALE || 'FLj50PrMa40MhGHappOt')
    : (ELEVENLABS_VOICE_MALE   || 'tMvyQtpCVQ0DkixuYm6J')
  const script   = buildScript(first_name, last_name, company_name)

  // Call ElevenLabs TTS
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

  const audioBuffer = Buffer.from(await ttsRes.arrayBuffer())
  const slug        = company_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
  const filename    = `voicemails/${slug}-${Date.now()}.mp3`

  const blob = await put(filename, audioBuffer, {
    access: 'public',
    contentType: 'audio/mpeg',
  })

  const generatedAt = new Date().toISOString()
  await logToAirtable({ firstName: first_name, lastName: last_name, company: company_name, voicemailUrl: blob.url, generatedAt })

  return res.status(200).json({
    voicemail_url: blob.url,
    generated_at: generatedAt,
    status: 'success',
  })
}
