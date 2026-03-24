// COMPONENT: Activity event log with type and status filters
// FLOW: Displays static mock events (replace with live Airtable fetch from Events table)
// DISPLAYS: Timestamp, lead name, event type (SMS/Email/Reply/Booked/Webhook), channel, message, status
// FEATURES: Type filter dropdown, status filter, full-text search, CSV export button
import { useState } from 'react'

interface LogEvent {
  id: string
  leadName: string
  leadId: string
  type: string
  channel: string
  message: string
  status: 'success' | 'failed' | 'pending'
  timestamp: string
}

const ALL_EVENTS: LogEvent[] = [
  { id: 'e01', leadName: 'Sarah Mitchell', leadId: '1', type: 'lead_created', channel: 'Tally', message: 'New lead created via Tally form submission', status: 'success', timestamp: '2026-03-18T08:12:00Z' },
  { id: 'e02', leadName: 'Sarah Mitchell', leadId: '1', type: 'sms_sent', channel: 'Twilio', message: 'Hi Sarah, this is Alex from BidBack! Saw your inquiry…', status: 'success', timestamp: '2026-03-18T08:12:05Z' },
  { id: 'e03', leadName: 'Sarah Mitchell', leadId: '1', type: 'email_sent', channel: 'Resend', message: 'Quick question about your service inquiry, Sarah', status: 'success', timestamp: '2026-03-18T08:12:08Z' },
  { id: 'e04', leadName: 'James Torres', leadId: '2', type: 'lead_created', channel: 'Tally', message: 'New lead created via Tally form submission', status: 'success', timestamp: '2026-03-18T09:34:00Z' },
  { id: 'e05', leadName: 'James Torres', leadId: '2', type: 'sms_sent', channel: 'Twilio', message: 'Hi James, this is Alex from BidBack! Saw your inquiry…', status: 'success', timestamp: '2026-03-18T09:34:08Z' },
  { id: 'e06', leadName: 'James Torres', leadId: '2', type: 'reply', channel: 'Twilio', message: '"Sounds good, call me!"', status: 'success', timestamp: '2026-03-18T09:41:00Z' },
  { id: 'e07', leadName: 'James Torres', leadId: '2', type: 'sms_sent', channel: 'Twilio', message: 'Great! I\'ll give you a call shortly. What time works?', status: 'success', timestamp: '2026-03-18T09:41:15Z' },
  { id: 'e08', leadName: 'Ana Rivera', leadId: '3', type: 'lead_created', channel: 'CSV Upload', message: 'Lead imported from CSV file upload', status: 'success', timestamp: '2026-03-18T10:05:00Z' },
  { id: 'e09', leadName: 'Ana Rivera', leadId: '3', type: 'email_sent', channel: 'Resend', message: 'Quick question about your service inquiry, Ana', status: 'success', timestamp: '2026-03-18T10:05:12Z' },
  { id: 'e10', leadName: 'Ana Rivera', leadId: '3', type: 'booked', channel: 'Calendar', message: 'Appointment booked for March 20 at 2:00 PM EST', status: 'success', timestamp: '2026-03-18T10:22:00Z' },
  { id: 'e11', leadName: 'Mike Johnson', leadId: '4', type: 'lead_created', channel: 'Tally', message: 'New lead created via Tally form submission', status: 'success', timestamp: '2026-03-18T10:50:00Z' },
  { id: 'e12', leadName: 'Mike Johnson', leadId: '4', type: 'sms_sent', channel: 'Twilio', message: 'Hi Mike, this is Alex from BidBack! Saw your inquiry…', status: 'failed', timestamp: '2026-03-18T10:50:15Z' },
  { id: 'e13', leadName: 'Lisa Chen', leadId: '5', type: 'sms_sent', channel: 'Twilio', message: 'Hi Lisa, this is Alex from BidBack!…', status: 'success', timestamp: '2026-03-18T11:22:08Z' },
  { id: 'e14', leadName: 'David Park', leadId: '6', type: 'sms_sent', channel: 'Twilio', message: 'Follow-up #3 sent', status: 'success', timestamp: '2026-03-17T09:00:00Z' },
  { id: 'e15', leadName: 'David Park', leadId: '6', type: 'status_change', channel: 'System', message: 'Status updated to No Response after 3 follow-ups', status: 'success', timestamp: '2026-03-17T10:00:00Z' },
  { id: 'e16', leadName: 'Emily Watson', leadId: '7', type: 'booked', channel: 'Calendar', message: 'Appointment booked for March 19 at 10:00 AM EST', status: 'success', timestamp: '2026-03-18T12:48:00Z' },
  { id: 'e17', leadName: 'Priya Patel', leadId: '9', type: 'reply', channel: 'SMS', message: '"Yes, I\'m interested! When can we talk?"', status: 'success', timestamp: '2026-03-18T13:15:00Z' },
  { id: 'e18', leadName: 'Carlos Reyes', leadId: '8', type: 'lead_created', channel: 'CSV Upload', message: 'Lead imported from CSV file upload', status: 'success', timestamp: '2026-03-18T13:00:00Z' },
  { id: 'e19', leadName: 'Carlos Reyes', leadId: '8', type: 'webhook_sent', channel: 'Make.com', message: 'Webhook fired to Make.com scenario', status: 'pending', timestamp: '2026-03-18T13:00:05Z' },
  { id: 'e20', leadName: 'Tom Bradley', leadId: '10', type: 'sms_sent', channel: 'Twilio', message: 'Hi Tom, this is Alex from BidBack!…', status: 'success', timestamp: '2026-03-18T13:30:08Z' },
]

const EVENT_TYPES = ['All', 'lead_created', 'sms_sent', 'email_sent', 'reply', 'booked', 'webhook_sent', 'status_change']

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  sms_sent: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'SMS' },
  email_sent: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Email' },
  reply: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Reply' },
  booked: { bg: 'bg-green-100', text: 'text-green-700', label: 'Booked' },
  lead_created: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Lead Created' },
  webhook_sent: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Webhook' },
  status_change: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Status Change' },
}

const STATUS_STYLES: Record<string, string> = {
  success: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-600 border-red-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit',
  })
}

export default function Logs() {
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed' | 'pending'>('all')
  const [search, setSearch] = useState('')

  const filtered = ALL_EVENTS.filter(ev => {
    const matchType = typeFilter === 'All' || ev.type === typeFilter
    const matchStatus = statusFilter === 'all' || ev.status === statusFilter
    const matchSearch = !search || ev.leadName.toLowerCase().includes(search.toLowerCase()) || ev.message.toLowerCase().includes(search.toLowerCase())
    return matchType && matchStatus && matchSearch
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const successCount = ALL_EVENTS.filter(e => e.status === 'success').length
  const failedCount = ALL_EVENTS.filter(e => e.status === 'failed').length
  const pendingCount = ALL_EVENTS.filter(e => e.status === 'pending').length

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-500 text-sm mt-1">{ALL_EVENTS.length} total events</p>
        </div>
        <button className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:border-gray-300 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Successful', count: successCount, style: 'text-green-600', bg: 'bg-green-50 border-green-200' },
          { label: 'Failed', count: failedCount, style: 'text-red-600', bg: 'bg-red-50 border-red-200' },
          { label: 'Pending', count: pendingCount, style: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <div className={`text-2xl font-bold ${s.style}`}>{s.count}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by lead name or message…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
        />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
        >
          {EVENT_TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t.replace('_', ' ')}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Log table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Timestamp</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Lead</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Type</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Channel</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Message</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(ev => {
                const typeStyle = TYPE_STYLES[ev.type] || { bg: 'bg-gray-100', text: 'text-gray-600', label: ev.type }
                return (
                  <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(ev.timestamp)}</td>
                    <td className="px-5 py-3 font-medium text-gray-800 whitespace-nowrap">{ev.leadName}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                        {typeStyle.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{ev.channel}</td>
                    <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{ev.message}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[ev.status]}`}>
                        {ev.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No events match your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
