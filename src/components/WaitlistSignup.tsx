// COMPONENT: Email waitlist signup section
import { useState } from 'react'

export default function WaitlistSignup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && name.trim().length >= 2

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || status === 'loading') return
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      })

      if (res.status === 409) {
        setErrorMsg("You're already on the list!")
        setStatus('error')
        return
      }

      if (!res.ok) throw new Error('Request failed')

      setStatus('success')
      setName('')
      setEmail('')
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <section id="waitlist" className="py-16 px-4 bg-[#6D8196]/10 dark:bg-gray-900/60">
      <div className="max-w-xl mx-auto text-center">
        <span className="text-xs font-semibold text-[#f97316] uppercase tracking-widest">✦ Early Access</span>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-2">
          Want Early Access?
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Join our waitlist to be first when BidBack launches.
        </p>

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white text-lg">You're on the list!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Check your email for confirmation.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => { setName(e.target.value); if (status === 'error') setStatus('idle') }}
              className="w-full min-h-[44px] border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6D8196] transition-shadow"
              required
              minLength={2}
            />
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={e => { setEmail(e.target.value); if (status === 'error') setStatus('idle') }}
              className="w-full min-h-[44px] border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6D8196] transition-shadow"
              required
            />
            {status === 'error' && errorMsg && (
              <p className="text-sm text-red-500 text-left">{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={!valid || status === 'loading'}
              className="w-full min-h-[44px] bg-[#6D8196] hover:bg-[#5a6e80] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg text-sm transition-colors"
            >
              {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500">No spam. We'll only reach out when it's ready.</p>
          </form>
        )}
      </div>
    </section>
  )
}
