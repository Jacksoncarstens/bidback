// AES-256-GCM encryption for PII stored in Airtable (phone, email).
// ENCRYPTION_KEY env var: 32 random bytes as 64 hex chars.
// Generate:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
//
// Schema note: encrypted fields use a "Encrypted" suffix (e.g. PhoneEncrypted).
// For equality lookups (e.g. finding a lead by phone), use hashForLookup() and store
// a separate hash field (e.g. PhoneHash) — HMAC is deterministic so filters still work.
import crypto from 'crypto'

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex) throw new Error('ENCRYPTION_KEY env var not set')
  if (hex.length !== 64) throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex chars)')
  return Buffer.from(hex, 'hex')
}

/** Encrypt plaintext → "iv:ciphertext:authTag" (all hex). Returns original value if ENCRYPTION_KEY not set. */
export function encrypt(text: string): string {
  if (!text) return text
  try {
    const key = getKey()
    const iv = crypto.randomBytes(12) // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`
  } catch {
    // If key not configured, return plaintext (graceful degradation — log warning)
    console.warn('[encrypt] ENCRYPTION_KEY not set — storing plaintext')
    return text
  }
}

/** Decrypt "iv:ciphertext:authTag" → plaintext. Returns original value if not in encrypted format. */
export function decrypt(encoded: string): string {
  if (!encoded || !encoded.includes(':')) return encoded
  try {
    const key = getKey()
    const parts = encoded.split(':')
    if (parts.length !== 3) return encoded
    const [ivHex, encHex, tagHex] = parts
    const iv  = Buffer.from(ivHex,  'hex')
    const enc = Buffer.from(encHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
  } catch {
    // Return as-is if decryption fails (e.g. legacy plaintext record)
    return encoded
  }
}

/**
 * Deterministic HMAC-SHA256 hash for Airtable equality lookups.
 * Use this for PhoneHash / EmailHash fields so you can filter by
 * {PhoneHash}="${hashForLookup(phone)}" without exposing raw data.
 */
export function hashForLookup(value: string): string {
  const key = process.env.ENCRYPTION_KEY || 'fallback-hash-key'
  return crypto
    .createHmac('sha256', key)
    .update(value.toLowerCase().trim())
    .digest('hex')
}
