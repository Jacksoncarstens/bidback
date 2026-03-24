/// <reference types="vite/client" />
// COMPONENT: Checkout cart / plan selection page
// FLOW: Reads plan from URL query params → POST /api/create-checkout → redirects to Stripe-hosted checkout
// INTEGRATES: /api/create-checkout (Stripe session creation)
import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import logoImg from '../assets/logo-icon.png'

const PLANS = {
  ppa: {
    name: 'Starter',
    price: '$150/mo',
    desc: 'Perfect for testing the waters with your first lead list.',
    features: [
      'Up to 300 leads per month',
      'SMS outreach to every lead',
      'AI sequences — smart timing + conditional logic',
      'Leads saved and organized automatically',
      'Email support',
    ],
  },
  pro: {
    name: 'Pro',
    price: '$400/mo',
    desc: 'For contractors doing real volume. This is where the ROI kicks in hard.',
    features: [
      'Up to 1,000 leads per month',
      'SMS + Voicemail drops',
      'AI sequences — smart timing + conditional logic',
      'Handles conversations and books appointments for you',
      'Priority support',
    ],
  },
  ent: {
    name: 'Enterprise',
    price: '$800/mo',
    desc: 'Running an agency or multiple locations? Built for you.',
    features: [
      'Up to 3,000 leads per month',
      'SMS + Email + Voicemail',
      'AI sequences — smart timing + conditional logic',
      'Auto follow-up text at +2 days if no reply',
      'Priority support',
      'Custom integrations',
    ],
  },
} as const

type PlanKey = keyof typeof PLANS

export default function Cart() {
  const [searchParams] = useSearchParams()
  const planKey = (searchParams.get('plan') ?? 'ppa') as PlanKey
  const plan = PLANS[planKey] ?? PLANS.ppa

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey, email, name, company }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout failed')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="BidBack" className="h-8 w-auto" />
            <span className="font-bold text-xl text-gray-900 dark:text-white">BidBack</span>
          </Link>
          <Link to="/#pricing" className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#f97316] transition-colors">
            ← Back to pricing
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Plan summary */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8">
            <p className="text-xs font-semibold text-[#f97316] uppercase tracking-widest mb-3">Your Plan</p>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">{plan.name}</h2>
            <p className="text-3xl font-bold text-[#1e3a8a] dark:text-[#f97316] mb-2">{plan.price}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{plan.desc}</p>
            <ul className="space-y-2.5">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">30-day money-back guarantee. No setup fees. Cancel anytime.</p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your details</h2>
            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jake Smith"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jake@jakeeroofing.com"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Jake's Roofing"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1e3a8a] text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-900 transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Redirecting…' : 'Proceed to Checkout →'}
              </button>
              {error && <p className="text-xs text-red-500 text-center mt-1">{error}</p>}
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
                You'll be redirected to Stripe's secure checkout.
              </p>
            </form>
          </div>

        </div>
      </main>
    </div>
  )
}
