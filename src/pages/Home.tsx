/// <reference types="vite/client" />
// COMPONENT: Public marketing homepage
// FLOW: Static landing page — pricing CTA calls POST /api/create-checkout to start Stripe checkout
// DISPLAYS: Hero, trade logos, features, pricing tiers (PPA/Pro/Enterprise), FAQ, footer
// INTEGRATES: /api/create-checkout (Stripe) when user clicks a pricing plan button
import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logoImg from '../assets/logo-icon.png'
import { CinematicHero } from '../components/ui/bidback-cinematic-hero'
import TestimonialsSection from '../components/TestimonialsSection'
import PricingSection from '../components/PricingSection'
import WaitlistSignup from '../components/WaitlistSignup'
import TrustBadges from '../components/TrustBadges'

const FAQS = [
  {
    q: "How long does setup take?",
    a: "Setup is quick. Once Twilio approves your account (1–2 weeks), you can upload your first CSV and start within hours. No coding required.",
  },
  {
    q: "What happens if a lead replies STOP?",
    a: "STOP replies are automatically respected. We remove them from all future campaigns and you're notified. Full TCPA compliance.",
  },
  {
    q: "Is BidBack TCPA compliant?",
    a: "Yes. We require leads to opt-in via our consent form before any messages are sent. All compliance documentation is provided for your records.",
  },
  {
    q: "How much does it cost?",
    a: "Pricing is per-lead. We'll send SMS and voicemail messages to revive your leads. Exact pricing available after sign-up.",
  },
  {
    q: "Can I customize the messages?",
    a: "Yes. You can customize the message templates for SMS, voicemail, and email to match your brand voice.",
  },
  {
    q: "What if a lead opts out?",
    a: "All opt-out requests are honored immediately. We manage the compliance side so you don't have to worry.",
  },
  {
    q: "Do I need my own Twilio account?",
    a: "No. We manage Twilio for you. You just upload leads and track replies.",
  },
  {
    q: "Can I track replies and metrics?",
    a: "Absolutely. Your portal shows every lead's status: replied, interested, not interested, pending. Full analytics dashboard.",
  },
]

const COMPARE_ROWS = [
  { feature: 'Setup time',         leadly: '10 minutes',         ghl: '2-4 weeks',        hire: '2-4 weeks' },
  { feature: 'Monthly cost',       leadly: 'From $150/mo',       ghl: '$297+ plus addons', hire: '$3,000-5,000/mo' },
  { feature: 'Works without help', leadly: true,                  ghl: false,              hire: false },
  { feature: 'Built for contractors', leadly: true,              ghl: false,              hire: null },
  { feature: 'No annual contract', leadly: true,                  ghl: false,              hire: null },
  { feature: 'CSV lead upload',    leadly: true,                  ghl: true,               hire: true },
  { feature: 'Auto follow-up',     leadly: true,                  ghl: true,               hire: true },
]

const NAV_LINKS = ['How It Works', 'Pricing', 'FAQ']

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Upload your lead list',
    desc: 'Got a CSV of old leads, past quotes, or contacts that went cold? Drop it in. Takes 30 seconds.',
  },
  {
    step: '02',
    title: 'We reach out for you',
    desc: 'BidBack sends a personal text and email to every lead within seconds. Then follows up automatically until they respond.',
  },
  {
    step: '03',
    title: 'You close the job',
    desc: 'When a lead responds and is ready to talk, you step in. We hand it off clean you just show up and close.',
  },
]

const EXAMPLE_LEADS = [
  { name: 'John Smith',    company: 'Smith Plumbing',     status: 'Replied',       message: 'Yes, interested!',          date: 'Mar 28' },
  { name: 'Sarah Jones',   company: 'Jones Electric',     status: 'Pending',       message: 'SMS sent',                  date: 'Mar 27' },
  { name: 'Mike Brown',    company: 'Brown HVAC',         status: 'Not Interested',message: 'Not looking right now',     date: 'Mar 26' },
  { name: 'Lisa Garcia',   company: 'Garcia Roofing',     status: 'Replied',       message: 'Send me a quote',           date: 'Mar 26' },
  { name: 'David Kim',     company: 'Kim Construction',   status: 'Pending',       message: 'Email sent',                date: 'Mar 25' },
  { name: 'Tony Rivera',   company: 'Rivera Landscaping', status: 'Replied',       message: 'When can you come out?',    date: 'Mar 24' },
  { name: 'Amy Chen',      company: 'Chen Remodeling',    status: 'Not Interested',message: 'Already hired someone',     date: 'Mar 23' },
]

const FEATURES = [
  {
    icon: '⚡',
    title: 'First to reach them wins',
    desc: 'The contractor who responds first gets the job 78% of the time. BidBack texts and emails your leads in seconds, not hours.',
  },
  {
    icon: '💬',
    title: 'Conversations that don\'t sound robotic',
    desc: 'Our messages are written to sound like they came from you not a bot. Leads respond because they actually feel heard.',
  },
  {
    icon: '📞',
    title: 'Voicemails that get called back',
    desc: 'Drop a personalized voicemail without the phone ever ringing. Leads listen when it\'s convenient and call you back ready to book.',
  },
  {
    icon: '🔁',
    title: 'Follows up so you don\'t have to',
    desc: 'Most leads need 5+ touches before they respond. BidBack handles every follow-up automatically you\'ll never chase a lead again.',
  },
  {
    icon: '📊',
    title: 'Know exactly what\'s happening',
    desc: 'One dashboard. Texts sent, emails opened, calls made, jobs booked. No spreadsheets, no guessing.',
  },
  {
    icon: '🔗',
    title: 'Plugs into what you already use',
    desc: 'Works with your existing forms, CRM, or spreadsheets. No new systems to learn just connect and go.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <button
        className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{q}</span>
        <span className={`text-[#f97316] text-xl shrink-0 transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

function AdminModal({ onClose }: { onClose: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  function submit() {
    if (pw === 'leadly-admin-2026') {
      localStorage.setItem('adminAuth', '1')
      onClose()
      navigate('/master/dashboard')
    } else {
      setErr(true)
      setPw('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Admin Access</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Enter admin password to continue.</p>
        <input
          ref={inputRef}
          autoFocus
          type="password"
          value={pw}
          onChange={e => { setPw(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Password"
          className={`w-full border rounded-lg px-4 py-2.5 text-sm mb-3 outline-none focus:ring-2 focus:ring-[#1e3a8a] dark:bg-gray-800 dark:text-white ${err ? 'border-red-400' : 'border-gray-300 dark:border-gray-700'}`}
        />
        {err && <p className="text-xs text-red-500 mb-3">Incorrect password.</p>}
        <div className="flex gap-3">
          <button onClick={submit} className="flex-1 bg-[#1e3a8a] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-blue-900 transition-colors">
            Sign In
          </button>
          <button onClick={onClose} className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold py-2.5 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">

      {/* NAV */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2">
            <img src={logoImg} alt="BidBack" className="h-9 w-auto" />
            <span className="font-bold text-xl text-gray-900 dark:text-white">BidBack</span>
          </a>
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#2563eb] dark:hover:text-[#f97316] transition-colors">
                {l}
              </a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <Link to="/signin" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#2563eb] dark:hover:text-[#f97316]">Sign In</Link>
            <a href="#waitlist" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#2563eb] dark:hover:text-[#f97316] hover:underline">Waitlist</a>
            <a href="#waitlist" className="bg-[#1e3a8a] text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors">
              Get Started
            </a>
          </div>
          <div className="md:hidden flex items-center gap-1">
            <button className="p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              <div className="w-5 h-0.5 bg-gray-700 dark:bg-gray-300 mb-1" />
              <div className="w-5 h-0.5 bg-gray-700 dark:bg-gray-300 mb-1" />
              <div className="w-5 h-0.5 bg-gray-700 dark:bg-gray-300" />
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-3 space-y-2">
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} className="block py-2 text-sm text-gray-700 dark:text-gray-300" onClick={() => setMobileOpen(false)}>
                {l}
              </a>
            ))}
            <Link to="/signin" className="block py-2 text-sm text-gray-700 dark:text-gray-300" onClick={() => setMobileOpen(false)}>
              Sign In
            </Link>
            <a href="#waitlist" className="block py-2 text-sm text-gray-700 dark:text-gray-300" onClick={() => setMobileOpen(false)}>
              Waitlist
            </a>
            <a href="#waitlist" className="block w-full bg-[#1e3a8a] text-white text-sm px-4 py-2 rounded-lg text-center mt-2" onClick={() => setMobileOpen(false)}>
              Get Started
            </a>
          </div>
        )}
      </header>

      <CinematicHero />

      <WaitlistSignup />

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-[#f97316] uppercase tracking-widest">✦ How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-2">Set up in 10 minutes. Results the same day.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(h => (
              <div key={h.step} className="relative">
                <div className="text-5xl font-extrabold text-gray-100 dark:text-gray-800 mb-3 select-none">{h.step}</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{h.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>

          {/* DASHBOARD PREVIEW */}
          <div className="mt-20">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Here's What You'll See</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Every lead automatically tracked in one dashboard</p>
            </div>
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-2xl">
              {/* Browser chrome */}
              <div className="bg-gray-200 dark:bg-gray-800 px-4 py-2.5 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white dark:bg-gray-700 rounded px-3 py-1 text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                  app.bidback.io/dashboard
                </div>
              </div>
              {/* Portal */}
              <div className="bg-white dark:bg-[#1A1A1A]">
                {/* Portal header */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">My Leads</h3>
                  <div className="flex items-center gap-2">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5 hidden sm:flex">
                      <span>🔍</span> Search leads…
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-default">
                      Filter ▾
                    </div>
                  </div>
                </div>
                {/* Stats bar */}
                <div className="grid grid-cols-4 divide-x divide-gray-100 dark:divide-gray-800 border-b border-gray-100 dark:border-gray-800">
                  {[
                    { label: 'Total',        value: '446', color: 'text-gray-900 dark:text-white' },
                    { label: 'Replied',      value: '128', color: 'text-green-600 dark:text-green-400' },
                    { label: 'Not Interested', value: '87', color: 'text-red-500 dark:text-red-400' },
                    { label: 'Pending',      value: '231', color: 'text-blue-600 dark:text-blue-400' },
                  ].map(s => (
                    <div key={s.label} className="px-2 sm:px-4 py-3 text-center">
                      <div className={`text-lg sm:text-xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Company</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Last Message</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {EXAMPLE_LEADS.map((lead, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white text-sm">{lead.name}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm hidden sm:table-cell">{lead.company}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              lead.status === 'Replied'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : lead.status === 'Pending'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>{lead.status}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm hidden md:table-cell">{lead.message}</td>
                          <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs hidden sm:table-cell">{lead.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">1–7 of 446 leads</span>
                  <div className="flex gap-1">
                    <button className="px-3 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded text-gray-400 dark:text-gray-500">← Prev</button>
                    <button className="px-3 py-1 text-xs bg-[#1e3a8a] text-white rounded">1</button>
                    <button className="px-3 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded text-gray-500 dark:text-gray-400">Next →</button>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              SMS replies, email opens, voicemail drops — all in one place
            </p>
          </div>
        </div>
      </section>

      <TestimonialsSection />

      {/* FEATURES */}
      <section id="features" className="py-20 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <div className="mb-14">
            <span className="text-xs font-semibold text-[#f97316] uppercase tracking-widest">✦ Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-2">Everything between "lead" and "booked job"</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-xl">Most contractors drop the ball between getting a lead and closing the job. BidBack handles every step in between.</p>
          </div>
          <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`flex items-start gap-6 py-8 ${i % 2 === 1 ? 'flex-row-reverse' : ''}`}>
                <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center text-2xl shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{f.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-[#f97316] uppercase tracking-widest">✦ Why BidBack</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-2">The honest comparison</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-3">There are other options. Here's how they stack up.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium w-1/3"></th>
                  <th className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 bg-[#1e3a8a] text-white px-3 py-1 rounded-full text-xs font-bold">✦ BidBack</span>
                  </th>
                  <th className="py-3 px-4 text-center text-gray-500 dark:text-gray-400 font-medium text-xs">GoHighLevel</th>
                  <th className="py-3 px-4 text-center text-gray-500 dark:text-gray-400 font-medium text-xs">Hiring Someone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {COMPARE_ROWS.map(row => (
                  <tr key={row.feature} className="bg-white dark:bg-gray-800/50">
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">{row.feature}</td>
                    <td className="py-3 px-4 text-center">
                      {row.leadly === true ? <span className="text-green-500 font-bold text-base">✓</span>
                        : row.leadly === false ? <span className="text-red-400">✗</span>
                        : row.leadly === null ? <span className="text-gray-300 dark:text-gray-700 text-xs">—</span>
                        : <span className="text-[#1e3a8a] dark:text-blue-400 font-semibold text-xs">{row.leadly}</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.ghl === true ? <span className="text-green-500">✓</span>
                        : row.ghl === false ? <span className="text-red-400">✗</span>
                        : row.ghl === null ? <span className="text-gray-300 dark:text-gray-700 text-xs">—</span>
                        : <span className="text-gray-500 dark:text-gray-400 text-xs">{row.ghl}</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.hire === true ? <span className="text-green-500">✓</span>
                        : row.hire === false ? <span className="text-red-400">✗</span>
                        : row.hire === null ? <span className="text-gray-300 dark:text-gray-700 text-xs">—</span>
                        : <span className="text-gray-500 dark:text-gray-400 text-xs">{row.hire}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <PricingSection />

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-[#f97316] uppercase tracking-widest">✦ FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-2">Questions we get a lot</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>



      {/* CTA */}
      <section className="py-24 px-4 bg-[#1e3a8a] dark:bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#f97316] opacity-[0.06] rounded-full blur-3xl" />
        </div>
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <img src={logoImg} alt="" className="h-12 w-auto mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">There are jobs sitting in your old lead list right now.</h2>
          <p className="text-blue-200 dark:text-gray-400 mb-2">The contractor who follows up wins. BidBack makes sure that contractor is you.</p>
          <p className="text-blue-300 dark:text-gray-500 text-sm mb-8">Join 500+ contractors already winning back business on autopilot.</p>
          <a href="#pricing" className="inline-block bg-[#f97316] text-white px-10 py-4 rounded-lg font-bold text-base hover:bg-orange-600 transition-colors shadow-lg">
            Start Recovering Leads Today
          </a>
          <p className="text-blue-300 dark:text-gray-500 text-xs mt-4">30-day money-back guarantee · No setup fees · Cancel anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 dark:bg-black text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-8">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src={logoImg} alt="BidBack" className="h-7 w-auto" />
              <span className="font-bold text-white text-lg">BidBack</span>
            </div>
            <p className="text-sm leading-relaxed">Automated lead follow-up built for contractors who are tired of chasing.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Product</h4>
            <ul className="space-y-2">
              <li><a href="#how-it-works" className="text-sm hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#features" className="text-sm hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-sm hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#faq" className="text-sm hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#waitlist" className="text-sm hover:text-white transition-colors">Join Waitlist</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/cookies" className="text-sm hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <TrustBadges />
        <div className="max-w-6xl mx-auto pt-2 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
          <span>© {new Date().getFullYear()} BidBack. All rights reserved.</span>
          <span>Built for contractors who close.</span>
          <button onClick={() => setShowAdmin(true)} className="text-gray-700 hover:text-gray-500 transition-colors text-xs opacity-30 hover:opacity-60">
            Admin
          </button>
        </div>
      </footer>

      {showAdmin && <AdminModal onClose={() => setShowAdmin(false)} />}
    </div>
  )
}
