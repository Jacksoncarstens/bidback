// COMPONENT: Master admin overview dashboard
// FLOW: Fetches GET /api/get-all-leads on mount to compute KPI counts
// DISPLAYS: Active customers, MRR, total leads, replied count, booked count
// FEATURES: System health link (/api/health), recent signups panel
import { useState, useEffect } from 'react'

interface LeadCounts {
  total: number
  replied: number
  booked: number
}

export default function MasterDashboard() {
  const [counts, setCounts] = useState<LeadCounts | null>(null)

  useEffect(() => {
    fetch('/api/get-all-leads')
      .then(r => r.json())
      .then(data => {
        const leads = data.leads || []
        setCounts({
          total: leads.length,
          replied: leads.filter((l: { status: string }) => l.status === 'Replied').length,
          booked: leads.filter((l: { status: string }) => l.status === 'Booked').length,
        })
      })
      .catch(() => {})
  }, [])

  const kpis = [
    { label: 'Active Customers', value: '—' },
    { label: 'MRR', value: '$0' },
    { label: 'Total Leads', value: counts ? counts.total.toLocaleString() : '…' },
    { label: 'Replied', value: counts ? counts.replied.toLocaleString() : '…' },
    { label: 'Booked', value: counts ? counts.booked.toLocaleString() : '…' },
  ]

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Business Overview</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <a
          href="/api/health"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          System Health
        </a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map(card => (
          <div key={card.label} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <p className="text-xs text-gray-400 font-medium">{card.label}</p>
            <p className="text-3xl font-extrabold mt-1 text-white">{card.value}</p>
            <p className="text-xs text-gray-600 mt-2">
              {card.value === '—' || card.value === '$0' ? 'No data yet' : 'Live from Airtable'}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">Recent Signups</h3>
          <a href="/master/customers" className="text-xs text-blue-400 hover:text-blue-300">View all →</a>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-400 font-medium">No customers yet</p>
          <p className="text-gray-600 text-sm mt-1">Signups will appear here once people start paying.</p>
        </div>
      </div>
    </div>
  )
}
