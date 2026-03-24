// CORS helper — call at the top of every public-facing API handler.
// Returns false if the request should be rejected or was handled (OPTIONS preflight).
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Allowed origins: your production domain + any Vercel preview deployments
function isAllowedOrigin(origin: string): boolean {
  const appUrl = process.env.NEXT_PUBLIC_URL || ''
  if (appUrl && origin === appUrl) return true
  if (origin === 'https://bidback.io') return true
  if (origin === 'https://www.bidback.io') return true
  // Allow Vercel preview URLs for the same project
  if (origin.endsWith('.vercel.app')) return true
  // Allow localhost in development
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return true
  return false
}

export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin as string | undefined

  if (origin) {
    if (!isAllowedOrigin(origin)) {
      res.status(403).json({ error: 'CORS policy violation' })
      return false
    }
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return false
  }

  return true
}
