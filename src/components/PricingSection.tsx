// COMPONENT: Pricing section for marketing homepage
// FLOW: Clicking a plan CTA navigates to /cart?plan=<slug> which calls POST /api/create-checkout
import { Link } from 'react-router-dom'

const PRICING = [
  {
    name: 'Starter',
    price: '$150',
    period: '/mo',
    desc: 'Perfect for testing the waters with your first lead list.',
    features: [
      'Up to 300 leads per month',
      'SMS outreach to every lead',
      'AI sequences — smart timing + conditional logic',
      'Leads saved and organized automatically',
      'Email support',
    ],
    cta: 'Get Started',
    highlight: false,
    cartSlug: 'ppa',
    roi: 'One job covers your first month.',
  },
  {
    name: 'Pro',
    price: '$400',
    period: '/mo',
    desc: 'For contractors doing real volume. This is where the ROI kicks in hard.',
    features: [
      'Up to 1,000 leads per month',
      'SMS + Voicemail drops',
      'AI sequences — smart timing + conditional logic',
      'Handles conversations and books appointments for you',
      'Priority support',
    ],
    cta: 'Get Started',
    highlight: true,
    cartSlug: 'pro',
    roi: 'Most customers book 10-20 jobs in month one.',
  },
  {
    name: 'Enterprise',
    price: '$800',
    period: '/mo',
    desc: 'Running an agency or multiple locations? Built for you.',
    features: [
      'Up to 3,000 leads per month',
      'SMS + Email + Voicemail',
      'AI sequences — smart timing + conditional logic',
      'Auto follow-up text at +2 days if no reply',
      'Priority support',
      'Custom integrations',
    ],
    cta: 'Get Started',
    highlight: false,
    cartSlug: 'ent',
    roi: 'Scale across every location you run.',
  },
]

export default function PricingSection() {
  return (
    <section id="pricing" className="py-12 lg:py-24 bg-white dark:bg-[#1A1A1A]">
      <div className="max-w-5xl mx-auto px-4">

        <div className="text-center mb-14">
          <span className="text-xs font-semibold text-[#f97316] uppercase tracking-widest">✦ Pricing</span>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-[#E8E8E8] mt-2">
            One job pays for months of BidBack
          </h2>
          <p className="text-gray-600 dark:text-[#999999] text-lg mt-3 max-w-2xl mx-auto">
            No setup fees. No long-term contracts. Cancel anytime — though most people don't.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PRICING.map((p, i) => (
            <div
              key={p.name}
              className={`
                relative rounded-2xl backdrop-blur-md
                transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]
                ${p.highlight
                  ? 'md:scale-[1.04] border-2 border-[#1e3a8a] dark:border-[#f97316] bg-white/90 dark:bg-[#2A2A2A]/90 shadow-lg'
                  : 'border border-gray-200/50 dark:border-[#333333]/50 bg-white/80 dark:bg-[#1A1A1A]/80 shadow-sm'
                }
              `}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {p.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-[#f97316] text-white px-4 py-1 rounded-full text-sm font-bold shadow-sm whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-[#E8E8E8] mb-1">
                  {p.name}
                </h3>
                <p className="text-gray-600 dark:text-[#999999] text-sm mb-6">
                  {p.desc}
                </p>

                <div className="mb-2">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-[#E8E8E8]">{p.price}</span>
                  <span className="text-gray-600 dark:text-[#999999] ml-1">{p.period}</span>
                </div>
                <p className="text-xs font-semibold text-[#f97316] mb-6">💰 {p.roi}</p>

                <Link
                  to={`/cart?plan=${p.cartSlug}`}
                  className={`
                    block w-full text-center py-3 rounded-lg font-semibold text-sm
                    transition-all duration-200
                    ${p.highlight
                      ? 'bg-[#1e3a8a] dark:bg-[#f97316] text-white hover:opacity-90 hover:shadow-md hover:scale-[1.02]'
                      : 'border border-[#1e3a8a] dark:border-[#999999] text-[#1e3a8a] dark:text-[#999999] hover:bg-[#1e3a8a]/10 dark:hover:bg-white/5'
                    }
                  `}
                >
                  {p.cta}
                </Link>

                <div className="my-6 border-t border-gray-200 dark:border-[#333333]" />

                <ul className="space-y-3">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[#1e3a8a] dark:text-[#f97316] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                      <span className="text-gray-700 dark:text-[#E8E8E8] text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 dark:text-[#999999] mt-8">
          30-day money-back guarantee. If you don't recover at least one lead, we'll refund you — no questions asked.
        </p>
      </div>
    </section>
  )
}
