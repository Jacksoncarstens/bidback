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
    <section id="pricing" className="py-12 lg:py-24 bg-white dark:bg-[#030712]">
      <div className="max-w-5xl mx-auto px-4">

        <div className="text-center mb-14">
          <span className="text-xs font-semibold text-[#f97316] uppercase tracking-widest">✦ Pricing</span>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mt-2">
            One job pays for months of BidBack
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg mt-3 max-w-2xl mx-auto">
            No setup fees. No long-term contracts. Cancel anytime — though most people don't.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PRICING.map((p) => (
            <div
              key={p.name}
              className={`
                relative rounded-2xl p-8
                bg-white dark:bg-[#0F0F0F]
                border-2 border-[#6D8196]/30 dark:border-[#6D8196]
                shadow-md dark:shadow-2xl dark:shadow-[#6D8196]/30
                hover:shadow-lg dark:hover:shadow-[#6D8196]/40 hover:scale-105 hover:-translate-y-1
                transition-all duration-300 flex flex-col
                ${p.highlight
                  ? 'md:scale-[1.04] border-[#6D8196] dark:border-[#6D8196] dark:ring-2 dark:ring-[#6D8196]/50 dark:shadow-[#6D8196]/50'
                  : ''
                }
              `}
            >

              {p.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-block bg-[#FFFFE3] text-gray-900 px-4 py-1 rounded-full text-sm font-bold shadow-sm whitespace-nowrap">
                    ★ Most Popular
                  </span>
                </div>
              )}

              {/* Tier name + desc */}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {p.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                {p.desc}
              </p>

              {/* Price */}
              <div className="mb-2">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">{p.price}</span>
                <span className="text-gray-600 dark:text-gray-400 ml-2">{p.period}</span>
              </div>
              <p className="text-xs font-semibold text-[#f97316] mb-6">💰 {p.roi}</p>

              {/* CTA */}
              <Link
                to={`/cart?plan=${p.cartSlug}`}
                className={`
                  block w-full text-center py-3 rounded-lg font-semibold text-sm mb-8
                  transition-all duration-200 hover:shadow-md hover:scale-[1.02]
                  ${p.highlight
                    ? 'bg-[#6D8196] text-white'
                    : 'border-2 border-[#6D8196] text-[#6D8196] hover:bg-[#6D8196]/5 dark:hover:bg-[#6D8196]/10'
                  }
                `}
              >
                {p.cta}
              </Link>

              {/* Divider */}
              <div className="border-t-2 border-[#6D8196]/20 dark:border-[#6D8196]/40 mb-6" />

              {/* Features */}
              <ul className="space-y-3 flex-1">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#6D8196] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{f}</span>
                  </li>
                ))}
              </ul>

            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-8">
          30-day money-back guarantee. If you don't recover at least one lead, we'll refund you — no questions asked.
        </p>
      </div>
    </section>
  )
}
