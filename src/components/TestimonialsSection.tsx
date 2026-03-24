// COMPONENT: Testimonials section for marketing homepage
const TESTIMONIALS = [
  {
    quote: "I uploaded 340 old leads on a Tuesday. By Thursday I had 6 callbacks and booked 2 jobs worth $14,000. I'd written those leads off months ago.",
    name: 'D. Paulson',
    role: 'Owner',
    company: 'Roofing Contractor',
    location: 'Minneapolis, MN',
    rating: 5,
    avatar: 'DP',
  },
  {
    quote: "We were losing jobs because we couldn't follow up fast enough. Now every lead gets a text within seconds. Our close rate went up 30% in the first month.",
    name: 'M. Gutierrez',
    role: 'Office Manager',
    company: 'HVAC Company',
    location: 'Dallas, TX',
    rating: 5,
    avatar: 'MG',
  },
  {
    quote: "GoHighLevel was way too complicated for us. This took 10 minutes to set up and started working immediately. Wish I'd found it sooner.",
    name: 'T. Briggs',
    role: 'Owner',
    company: 'Plumbing & Electric',
    location: 'Columbus, OH',
    rating: 5,
    avatar: 'TB',
  },
]

export default function TestimonialsSection() {
  return (
    <section className="py-12 lg:py-24 bg-gray-50 dark:bg-[#1A1A1A]">
      <div className="max-w-6xl mx-auto px-4">

        <div className="text-center mb-14">
          <span className="text-xs font-semibold text-[#f97316] uppercase tracking-widest">✦ Real Results</span>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-[#E8E8E8] mt-2">
            What Contractors Say
          </h2>
          <p className="text-gray-600 dark:text-[#999999] text-lg mt-3 max-w-2xl mx-auto">
            Real results from contractors who've turned dead leads into booked jobs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className={`
                rounded-2xl backdrop-blur-md p-8
                border border-white/20 dark:border-[#333333]/50
                bg-white/90 dark:bg-[#1A1A1A]/90
                transition-all duration-300
                hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1
                ${i === 1 ? 'md:-mt-3 shadow-lg' : 'shadow-sm'}
              `}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, j) => (
                  <svg
                    key={j}
                    className={`w-5 h-5 ${j < t.rating ? '' : 'opacity-20'}`}
                    style={{ color: j < t.rating ? '#FFFFE3' : '#999' }}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 dark:text-[#E8E8E8] text-base leading-relaxed mb-6 italic">
                "{t.quote}"
              </p>

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-[#333333] mb-5" />

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
                  style={{ backgroundColor: '#6D8196' }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-[#E8E8E8] text-sm">{t.name}</p>
                  <p className="text-xs text-gray-600 dark:text-[#999999]">
                    {t.role} · {t.company} · {t.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
