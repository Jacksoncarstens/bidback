// COMPONENT: All leads across all customer accounts
// FLOW: Fetches GET /api/get-all-leads on mount, auto-refreshes every 30s
// DISPLAYS: Name, Account, Phone, Email, Service, City, Source, Follow-Up, Status
// FEATURES: Status filter, full-text search, live count, manual refresh
import { useState, useEffect, useCallback } from 'react'

interface Lead {
  id: string
  accountId: string
  firstName: string
  lastName: string
  phone: string
  email: string
  status: string
  source: string
  service: string
  city: string
  notes: string
  followUpDate: string
  createdAt: string
}

const STATUS_STYLES: Record<string, string> = {
  New: 'bg-gray-700 text-gray-300',
  Contacted: 'bg-blue-900/40 text-blue-300',
  Replied: 'bg-orange-900/40 text-orange-400',
  Booked: 'bg-green-900/40 text-green-400',
  'No Response': 'bg-red-900/20 text-red-400',
}

const STATUS_OPTIONS = ['All', 'New', 'Contacted', 'Replied', 'Booked', 'No Response']

export default function MasterLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchLeads = useCallback(() => {
    fetch('/api/get-all-leads')
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch')
        return r.json()
      })
      .then(data => {
        setLeads(data.leads || [])
        setLastUpdated(new Date())
        setLoading(false)
        setError(null)
      })
      .catch(() => {
        setError('Failed to load leads from Airtable.')
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchLeads()
    const interval = setInterval(fetchLeads, 30_000)
    return () => clearInterval(interval)
  }, [fetchLeads])

  const filtered = leads.filter(l => {
    const matchStatus = filter === 'All' || l.status === filter
    const q = search.toLowerCase()
    const matchSearch =
      !search ||
      `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q) ||
      l.accountId.toLowerCase().includes(q) ||
      l.service.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const formatDate = (val: string) => {
    if (!val) return '—'
    try {
      return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return val
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">All Leads</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading
              ? 'Loading...'
              : `${leads.length.toLocaleString()} total leads across all accounts`}
            {lastUpdated && !loading && (
              <span className="ml-2 text-gray-600">
                · Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchLeads}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      {!loading && leads.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {STATUS_OPTIONS.slice(1).map(s => {
            const count = leads.filter(l => l.status === s).length
            return (
              <button
                key={s}
                onClick={() => setFilter(filter === s ? 'All' : s)}
                className={`bg-gray-800 border rounded-lg p-3 text-left transition-colors ${
                  filter === s ? 'border-blue-500' : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <p className="text-xs text-gray-400">{s}</p>
                <p className="text-2xl font-bold text-white mt-0.5">{count}</p>
              </button>
            )
          })}
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search name, email, phone, account, city, service..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-600"
        />
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                filter === s
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-gray-400 text-sm">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Fetching leads from Airtable...
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-red-400 font-medium">{error}</p>
            <button onClick={fetchLeads} className="mt-3 text-sm text-blue-400 hover:text-blue-300">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-400 font-medium">{leads.length === 0 ? 'No leads in Airtable yet' : 'No leads match this filter'}</p>
            {leads.length > 0 && (
              <button onClick={() => { setFilter('All'); setSearch('') }} className="mt-2 text-sm text-blue-400 hover:text-blue-300">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/60 border-b border-gray-800">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-400 whitespace-nowrap">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-400 whitespace-nowrap">Account</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-400 whitespace-nowrap hidden sm:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-400 whitespace-nowrap hidden md:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-400 whitespace-nowrap hidden lg:table-cell">Service</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-400 whitespace-nowrap hidden lg:table-cell">City</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-400 whitespace-nowrap hidden xl:table-cell">Source</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-400 whitespace-nowrap hidden xl:table-cell">Follow-Up</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-400 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map(l => (
                  <tr key={l.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{l.firstName} {l.lastName}</div>
                      {l.notes && (
                        <div className="text-xs text-gray-500 mt-0.5 max-w-[180px] truncate" title={l.notes}>
                          {l.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{l.accountId || '—'}</td>
                    <td className="px-4 py-3 text-gray-300 font-mono text-xs whitespace-nowrap hidden sm:table-cell">{l.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{l.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">{l.service || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">{l.city || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 hidden xl:table-cell">{l.source || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap hidden xl:table-cell">{formatDate(l.followUpDate)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[l.status] || STATUS_STYLES['New']}`}>
                        {l.status || 'New'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-600">
              Showing {filtered.length.toLocaleString()} of {leads.length.toLocaleString()} leads
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
