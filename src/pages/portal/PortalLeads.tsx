// COMPONENT: Single customer's leads
// FLOW: Fetches GET /api/get-leads?accountId=<X> based on auth
// DISPLAYS: Customer's leads only, filtered by status
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface Lead {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  status: string
  service: string
  city: string
  createdAt: string
}

const STATUS_STYLES: Record<string, string> = {
  New: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  Contacted: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  Replied: 'bg-orange-100 dark:bg-orange-900/40 text-[#f97316]',
  Booked: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
  'No Response': 'bg-red-50 dark:bg-red-900/20 text-red-500',
}

const STATUS_OPTIONS = ['All', 'New', 'Contacted', 'Replied', 'Booked', 'No Response']

export default function PortalLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem('portalCustomer')
    const info = raw ? JSON.parse(raw) : null
    const accountId = info?.company || info?.name || ''

    fetch(`/api/get-leads?accountId=${encodeURIComponent(accountId)}`)
      .then(r => r.json())
      .then(data => {
        setLeads(data.leads || [])
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load leads.')
        setLoading(false)
      })
  }, [])

  const filtered = leads.filter(l => {
    const matchStatus = filter === 'All' || l.status === filter
    const matchSearch = !search || 
      `${l.firstName} ${l.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      l.city.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Leads</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {loading ? 'Loading...' : `${leads.length} total leads`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name, phone, or city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#1e3a8a]"
        />
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                filter === s
                  ? 'bg-[#1e3a8a] text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400 text-sm">Loading leads...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-red-500 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No leads found</p>
            {leads.length === 0 && (
              <Link to="/portal/upload" className="mt-4 inline-block bg-[#1e3a8a] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-900 transition-colors">
                Upload Your First List
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">Name</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">Phone</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden sm:table-cell">City</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 hidden md:table-cell">Service</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{l.firstName} {l.lastName}</div>
                      {l.email && <div className="text-xs text-gray-400">{l.email}</div>}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">{l.phone}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{l.city}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">{l.service}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[l.status] || STATUS_STYLES['New']}`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
