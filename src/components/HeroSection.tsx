// COMPONENT: Marketing homepage hero section
// Two-column layout (copy + mock dashboard preview), stats bar, trades bar

const STAR_PARTICLES = [
  { top: '8%',  left: '12%',  size: 'w-1 h-1',     opacity: 'opacity-40' },
  { top: '15%', left: '80%',  size: 'w-1.5 h-1.5', opacity: 'opacity-30' },
  { top: '25%', left: '5%',   size: 'w-1 h-1',     opacity: 'opacity-20' },
  { top: '5%',  left: '60%',  size: 'w-1 h-1',     opacity: 'opacity-30' },
  { top: '40%', left: '92%',  size: 'w-1 h-1',     opacity: 'opacity-20' },
  { top: '55%', left: '3%',   size: 'w-1.5 h-1.5', opacity: 'opacity-20' },
  { top: '18%', left: '45%',  size: 'w-0.5 h-0.5', opacity: 'opacity-40' },
  { top: '30%', left: '70%',  size: 'w-1 h-1',     opacity: 'opacity-25' },
]

const TRADES = [
  { label: 'Roofing',    icon: '🏠' },
  { label: 'HVAC',       icon: '❄️' },
  { label: 'Plumbing',   icon: '🔧' },
  { label: 'Electrical', icon: '⚡' },
  { label: 'Landscaping',icon: '🌿' },
  { label: 'Remodeling', icon: '🔨' },
]

const MOCK_LEADS = [
  { name: 'D. Paulson',   status: 'Interested', dotClass: 'bg-[#f97316]', textClass: 'text-[#f97316]' },
  { name: 'M. Torres',    status: 'Contacted',  dotClass: 'bg-[#2563eb]', textClass: 'text-[#2563eb]' },
  { name: 'J. Williams',  status: 'Booked',     dotClass: 'bg-green-500', textClass: 'text-green-500' },
  { name: 'S. Kim',       status: 'Contacted',  dotClass: 'bg-[#2563eb]', textClass: 'text-[#2563eb]' },
]

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-[#f0f4ff] dark:from-gray-900 to-white dark:to-gray-950 py-20 lg:py-28 px-4 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-[#1e3a8a] opacity-[0.06] dark:opacity-[0.15] rounded-full blur-3xl" />
        <div className="absolute top-10 right-1/4 w-[200px] h-[200px] bg-[#f97316] opacity-[0.08] dark:opacity-[0.12] rounded-full blur-2xl" />
        {STAR_PARTICLES.map((s, i) => (
          <div key={i} className={`absolute ${s.size} ${s.opacity} bg-[#f97316] rounded-full`} style={{ top: s.top, left: s.left }} />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: Copy */}
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-950/50 text-[#f97316] text-xs font-semibold px-3 py-1.5 rounded-full mb-8 border border-orange-200 dark:border-orange-800">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse" />
              Built for contractors. Not agencies.
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
              You've got old leads<br />
              <span className="text-[#2563eb] dark:text-[#f97316]">sitting there making nothing.</span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-4 max-w-lg">
              Upload your list. BidBack texts, emails, and calls them for you within seconds. Most contractors recover 10–20 jobs from leads they'd already written off.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">No setup call. No annual contract. Cancel anytime.</p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <a
                href="#pricing"
                className="bg-[#1e3a8a] text-white px-8 py-3.5 rounded-lg font-semibold text-base hover:bg-blue-900 transition-colors shadow-md"
              >
                Start Recovering Leads
              </a>
              <a
                href="#how-it-works"
                className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-8 py-3.5 rounded-lg font-semibold text-base hover:border-[#f97316] hover:text-[#f97316] transition-colors"
              >
                See How It Works
              </a>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex -space-x-1.5">
                {['D','M','J','T','R'].map((l, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-900 bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] flex items-center justify-center text-white text-xs font-bold"
                  >
                    {l}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5 text-[#f97316]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">500+ contractors trust BidBack</p>
              </div>
            </div>
          </div>

          {/* Right: Mock dashboard card (desktop only) */}
          <div className="hidden lg:flex justify-center items-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="w-full max-w-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
              {/* Card header */}
              <div className="bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-xs font-medium">Live Campaign</p>
                    <p className="text-white font-bold text-sm mt-0.5">342 leads reached today</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs bg-white/20 text-white font-semibold px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Running
                  </span>
                </div>
              </div>
              {/* Lead rows */}
              <div className="px-4 py-3 space-y-2">
                {MOCK_LEADS.map((lead, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg px-3 py-2.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${lead.dotClass}`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 font-medium">{lead.name}</span>
                    <span className={`text-xs font-semibold ${lead.textClass}`}>{lead.status}</span>
                  </div>
                ))}
              </div>
              {/* Mini stats */}
              <div className="border-t border-gray-100 dark:border-gray-700/50 grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700/50 text-center py-3 px-2">
                {[
                  { val: '28',   label: 'Interested' },
                  { val: '6',    label: 'Booked' },
                  { val: '$42k', label: 'Est. Value' },
                ].map(s => (
                  <div key={s.label} className="px-2">
                    <div className="font-extrabold text-gray-900 dark:text-white text-base">{s.val}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/20 dark:border-gray-700 rounded-2xl shadow-lg px-6 py-6">
            {[
              { val: '80%', label: 'of sales need 5+ follow-ups to close' },
              { val: '44%', label: 'of contractors quit after just 1 attempt' },
              { val: '78%', label: 'of jobs go to whoever responds first' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#f97316]">{s.val}</div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trades bar */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Used by contractors in</p>
          <div className="flex flex-wrap justify-center gap-3">
            {TRADES.map(t => (
              <span key={t.label} className="inline-flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 text-sm px-3 py-1.5 rounded-full">
                {t.icon} {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
