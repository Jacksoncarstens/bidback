// JWT sign / verify using jose (ESM-native, no CJS issues)
// Secret: JWT_SECRET env var (falls back to dev default — set a real secret in Vercel)
import { SignJWT, jwtVerify } from 'jose'

function secret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || 'bidback-jwt-dev-secret-change-in-prod')
}

export interface TokenPayload {
  sub: string       // contractor Airtable record ID
  email: string
  firstName: string
  lastName: string
  company: string
  tier: string      // 'Free' | 'Starter' | 'Pro' | 'Enterprise'
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret())
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}
