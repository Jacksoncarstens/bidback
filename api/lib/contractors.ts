// Airtable CRUD for Contractors table
// Fields: Email, PasswordHash, FirstName, LastName, CompanyName, Phone, VoicemailUrl, Tier, CreatedAt

export interface Contractor {
  id: string
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  companyName: string
  phone: string
  voicemailUrl: string
  tier: string   // 'Free' | 'Starter' | 'Pro' | 'Enterprise'
  createdAt: string
}

type AirtableRecord = { id: string; fields: Record<string, string> }

async function req(path: string, options?: RequestInit): Promise<Response> {
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

function toContractor(rec: AirtableRecord): Contractor {
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

export async function findByEmail(email: string): Promise<Contractor | null> {
  const formula = encodeURIComponent(`LOWER({Email})="${email.toLowerCase()}"`)
  const res = await req(`/Contractors?filterByFormula=${formula}&maxRecords=1`)
  if (!res.ok) return null
  const data = await res.json() as { records: AirtableRecord[] }
  const rec = data.records?.[0]
  return rec ? toContractor(rec) : null
}

export async function create(data: Omit<Contractor, 'id'>): Promise<Contractor> {
  const res = await req('/Contractors', {
    method: 'POST',
    body: JSON.stringify({
      fields: {
        Email:        data.email.toLowerCase(),
        PasswordHash: data.passwordHash,
        FirstName:    data.firstName,
        LastName:     data.lastName,
        CompanyName:  data.companyName,
        Phone:        data.phone,
        VoicemailUrl: data.voicemailUrl,
        Tier:         data.tier || 'Free',
        CreatedAt:    data.createdAt,
      },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Airtable create failed: ${err}`)
  }
  const rec = await res.json() as AirtableRecord
  return toContractor(rec)
}

export async function setVoicemailUrl(id: string, voicemailUrl: string): Promise<void> {
  await req(`/Contractors/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: { VoicemailUrl: voicemailUrl } }),
  })
}

export async function setTier(id: string, tier: string): Promise<void> {
  await req(`/Contractors/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: { Tier: tier } }),
  })
}

export async function setTierByEmail(email: string, tier: string): Promise<boolean> {
  const contractor = await findByEmail(email)
  if (!contractor) return false
  await setTier(contractor.id, tier)
  return true
}
