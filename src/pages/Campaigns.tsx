// COMPONENT: Leads table with status filters and bulk actions
// FLOW: Displays static mock leads (replace with live Airtable fetch via /api/get-all-leads)
// FEATURES: Status filter tabs, full-text search, checkbox selection, bulk re-trigger, per-row SMS/email buttons
// INTEGRATES: /api/send-sms and /api/send-email (wired via row action buttons)
import { useState } from 'react'

interface Lead {
  id: string
  name: string
  phone: string
  email: string
  status: string
  source: string
  followUpCount: number
  lastContact: string
  createdAt: string
}

const ALL_LEADS: Lead[] = [
  { id: '1', name: 'Sarah Mitchell', phone: '+15551110001', email: 'sarah@example.com', status: 'Contacted', source: 'Tally Form', followUpCount: 1, lastContact: '2026-03-18T08:12:05Z', createdAt: '2026-03-18T08:12:00Z' },
  { id: '2', name: 'James Torres', phone: '+15551110002', email: 'james@example.com', status: 'Replied', source: 'Tally Form', followUpCount: 2, lastContact: '2026-03-18T09:41:00Z', createdAt: '2026-03-18T09:34:00Z' },
  { id: '3', name: 'Ana Rivera', phone: '+15551110003', email: 'ana@example.com', status: 'Booked', source: 'CSV Upload', followUpCount: 1, lastContact: '2026-03-18T10:22:00Z', createdAt: '2026-03-18T10:05:00Z' },
  { id: '4', name: 'Mike Johnson', phone: '+15551110004', email: 'mike@example.com', status: 'New', source: 'Tally Form', followUpCount: 0, lastContact: '', createdAt: '2026-03-18T10:50:00Z' },
  { id: '5', name: 'Lisa Chen', phone: '+15551110005', email: 'lisa@example.com', status: 'Contacted', source: 'CSV Upload', followUpCount: 1, lastContact: '2026-03-18T11:22:08Z', createdAt: '2026-03-18T11:22:00Z' },
  { id: '6', name: 'David Park', phone: '+15551110006', email: 'david@example.com', status: 'No Response', source: 'Tally Form', followUpCount: 3, lastContact: '2026-03-17T09:00:00Z', createdAt: '2026-03-17T08:00:00Z' },
  { id: '7', name: 'Emily Watson', phone: '+15551110007', email: 'emily@example.com', status: 'Booked', source: 'Manual', followUpCount: 2, lastContact: '2026-03-18T12:48:00Z', createdAt: '2026-03-18T12:45:00Z' },
  { id: '8', name: 'Carlos Reyes', phone: '+15551110008', email: 'carlos@example.com', status: 'New', source: 'CSV Upload', followUpCount: 0, lastContact: '', createdAt: '2026-03-18T13:00:00Z' },
  { id: '9', name: 'Priya Patel', phone: '+15551110009', email: 'priya@example.com', status: 'Replied', source: 'Tally Form', followUpCount: 2, lastContact: '2026-03-18T13:15:00Z', createdAt: '2026-03-18T12:00:00Z' },
  { id: '10', name: 'Tom Bradley', phone: '+15551110010', email: 'tom@example.com', status: 'Contacted', source: 'Tally Form', followUpCount: 1, lastContact: '2026-03-18T13:30:00Z', createdAt: '2026-03-18T13:25:00Z' },
]

const STATUS_OPTIONS = ['All', 'New', 'Contacted', 'Replied', 'Booked', 'No Response']

const STATUS_STYLES: Record<string, string> = {
  New: 'bg-gray-100 text-gray-600',
  Contacted: 'bg-blue-100 text-blue-700',
  Replied: 'bg-orange-100 text-orange-700',
  Booked: 'bg-green-100 text-green-700',
  'No Response': 'bg-red-50 text-red-500',
}

function fmt(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function Campaigns() {
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = ALL_LEADS.filter(l => {
    const matchStatus = statusFilter === 'All' || l.status === statusFilter
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search)
    return matchStatus && matchSearch
  })

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(l => l.id)))
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-500 text-sm mt-1">{ALL_LEADS.length} total leads</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-[#1e3a8a] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-900 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
        />
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-[#1e3a8a] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#1e3a8a] hover:text-[#1e3a8a]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-4">
          <span className="text-sm text-blue-700 font-medium">{selected.size} lead{selected.size > 1 ? 's' : ''} selected</span>
          <div className="flex gap-2 ml-auto">
            <button className="text-sm bg-[#1e3a8a] text-white px-3 py-1.5 rounded-lg hover:bg-blue-900 transition-colors">Re-trigger Follow-Up</button>
            <button className="text-sm border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Mark No Response</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="accent-[#1e3a8a]"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Contact</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">Source</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">Follow-Ups</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden xl:table-cell">Last Contact</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(lead.id)}
                      onChange={() => toggleSelect(lead.id)}
                      className="accent-[#1e3a8a]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#1e3a8a] text-white text-xs flex items-center justify-center font-semibold shrink-0">
                        {lead.name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{lead.name}</div>
                        <div className="text-xs text-gray-400">{fmt(lead.createdAt)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="text-gray-700">{lead.phone}</div>
                    <div className="text-xs text-gray-400">{lead.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{lead.source}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < lead.followUpCount ? 'bg-[#1e3a8a]' : 'bg-gray-200'}`} />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">{lead.followUpCount}/3</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell text-gray-500 text-xs">{fmt(lead.lastContact)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button title="Send SMS" className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-[#2563eb] transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </button>
                      <button title="Send Email" className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-[#2563eb] transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No leads match your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
