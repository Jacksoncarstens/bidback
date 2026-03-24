// COMPONENT: Sign-in / Sign-up page
// Sign In tab: email + password → POST /api/auth/signin → JWT stored in localStorage
// Sign Up tab: full form → POST /api/auth/signup → JWT + voicemail_url → success message
// Legacy access: bb- passwords and admin password still work as before
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoImg from '../assets/logo-icon.png'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || ''

function isLegacyPassword(pw: string): boolean {
  return /^bb-[a-f0-9]{8}$/.test(pw)
}

// Legacy access codes: populated via VITE_PORTAL_PASSWORDS env var
// Format: "label:password,label:password" — labels not shown to users
const KNOWN_ACCOUNTS: Record<string, { name: string; company: string; plan: string }> = {}

export default function SignIn() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <img src={logoImg} alt="BidBack" className="h-8 w-auto" />
          <span className="font-bold text-gray-900 dark:text-white text-lg">BidBack</span>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 mb-6">
          <button
            onClick={() => setTab('signin')}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${tab === 'signin' ? 'bg-[#1e3a8a] text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${tab === 'signup' ? 'bg-[#1e3a8a] text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
          >
            Sign Up
          </button>
        </div>

        {tab === 'signin'
          ? <SignInForm navigate={navigate} />
          : <SignUpForm navigate={navigate} />
        }

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-5 text-center">Powered by BidBack</p>
      </div>
    </div>
  )
}

/* ─── Sign In ────────────────────────────────────────────────── */
function SignInForm({ navigate }: { navigate: (to: string) => void }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Admin password shortcut
    if (password === ADMIN_PASSWORD && !email) {
      localStorage.setItem('adminToken', ADMIN_PASSWORD)
      navigate('/master/dashboard')
      return
    }

    // Legacy bb- / demo passwords
    if (!email && isLegacyPassword(password)) {
      localStorage.setItem('portalToken', password)
      const info = KNOWN_ACCOUNTS[password]
      if (info) localStorage.setItem('portalCustomer', JSON.stringify(info))
      navigate('/portal/dashboard')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json() as {
        token?: string; email?: string; contractor_id?: string;
        firstName?: string; lastName?: string; companyName?: string;
        voicemail_url?: string; tier?: string; error?: string
      }
      if (!res.ok) throw new Error(data.error || 'Sign in failed')

      localStorage.setItem('authToken', data.token!)
      localStorage.setItem('portalCustomer', JSON.stringify({
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || email.split('@')[0],
        company: data.companyName || '',
        plan: data.tier || 'Free',
        email: data.email,
        contractor_id: data.contractor_id,
        voicemail_url: data.voicemail_url,
      }))
      navigate('/portal/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
        <input
          type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
          placeholder="jake@jakesroofing.com"
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#1e3a8a]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
        <input
          type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }}
          placeholder="Your password"
          className={`w-full border rounded-lg px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#1e3a8a] ${error ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'}`}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm disabled:opacity-60"
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}

/* ─── Sign Up ────────────────────────────────────────────────── */
function SignUpForm({ navigate }: { navigate: (to: string) => void }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', company_name: '', phone: '', email: '', password: '',
  })
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [voicemailUrl, setVoicemail] = useState('')

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      setError('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json() as {
        token?: string; email?: string; contractor_id?: string;
        voicemail_url?: string; tier?: string; error?: string
      }
      if (!res.ok) throw new Error(data.error || 'Sign up failed')

      localStorage.setItem('authToken', data.token!)
      localStorage.setItem('portalCustomer', JSON.stringify({
        name: `${form.first_name} ${form.last_name}`,
        company: form.company_name,
        plan: data.tier || 'Free',
        email: data.email,
        contractor_id: data.contractor_id,
        voicemail_url: data.voicemail_url,
      }))
      setVoicemail(data.voicemail_url || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Success state
  if (voicemailUrl || (localStorage.getItem('authToken') && form.email)) {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">🎙️</div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Voicemail created!</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your AI voicemail is ready. Listen:</p>
        {voicemailUrl && (
          <audio controls src={voicemailUrl} className="w-full rounded-lg" />
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">Ready to upload leads.</p>
        <button
          onClick={() => navigate('/portal/dashboard')}
          className="w-full bg-[#1e3a8a] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-blue-900 transition-colors"
        >
          Go to Dashboard →
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
          <input type="text" required value={form.first_name} onChange={set('first_name')} placeholder="Jake"
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
          <input type="text" required value={form.last_name} onChange={set('last_name')} placeholder="Smith"
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
        <input type="text" required value={form.company_name} onChange={set('company_name')} placeholder="Jake's Roofing"
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
        <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+1 (555) 123-4567"
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
        <input type="email" required value={form.email} onChange={set('email')} placeholder="jake@jakesroofing.com"
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
        <input type="password" required value={form.password} onChange={set('password')} placeholder="At least 8 characters"
          className={`w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#1e3a8a] ${error ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'}`} />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full bg-[#1e3a8a] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-blue-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
      >
        {loading ? 'Creating account + voicemail…' : 'Create Account'}
      </button>
      <p className="text-xs text-gray-400 text-center">Your AI voicemail is generated automatically on signup.</p>
    </form>
  )
}
