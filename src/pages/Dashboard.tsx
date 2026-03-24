// COMPONENT: Admin-facing campaign dashboard with KPIs and event log
// FLOW: On mount checks Airtable config — loads live data if connected, falls back to mock data
// INTEGRATES: Airtable (fetchLeads, fetchEvents via src/lib/airtable.ts)
// DISPLAYS: Pipeline health score, KPI cards, conversion funnel, recent leads, live event log
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { isAirtableConfigured, fetchLeads, fetchEvents, normalizeLeadName, AirtableLead, AirtableEvent } from '../lib/airtable'

interface Lead {
  id: string
  name: string
  phone: string
  email: string
  status: string
  source: string
  createdAt: string
}

interface Event {
  id: string
  leadName: string
  type: string
  channel: string
  message: string
  timestamp: string
}

const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'Sarah Mitchell', phone: '+15551110001', email: 'sarah@example.com', status: 'Contacted', source: 'Tally Form', createdAt: '2026-03-18T08:12:00Z' },
  { id: '2', name: 'James Torres', phone: '+15551110002', email: 'james@example.com', status: 'Replied', source: 'Tally Form', createdAt: '2026-03-18T09:34:00Z' },
  { id: '3', name: 'Ana Rivera', phone: '+15551110003', email: 'ana@example.com', status: 'Booked', source: 'CSV Upload', createdAt: '2026-03-18T10:05:00Z' },
  { id: '4', name: 'Mike Johnson', phone: '+15551110004', email: 'mike@example.com', status: 'New', source: 'Tally Form', createdAt: '2026-03-18T10:50:00Z' },
  { id: '5', name: 'Lisa Chen', phone: '+15551110005', email: 'lisa@example.com', status: 'Contacted', source: 'CSV Upload', createdAt: '2026-03-18T11:22:00Z' },
  { id: '6', name: 'David Park', phone: '+15551110006', email: 'david@example.com', status: 'No Response', source: 'Tally Form', createdAt: '2026-03-18T12:01:00Z' },
  { id: '7', name: 'Emily Watson', phone: '+15551110007', email: 'emily@example.com', status: 'Booked', source: 'Manual', createdAt: '2026-03-18T12:45:00Z' },
]

const MOCK_EVENTS: Event[] = [
  { id: 'e1', leadName: 'Sarah Mitchell', type: 'sms_sent', channel: 'SMS', message: 'Initial follow-up SMS sent', timestamp: '2026-03-18T08:12:05Z' },
  { id: 'e2', leadName: 'James Torres', type: 'sms_sent', channel: 'SMS', message: 'Initial follow-up SMS sent', timestamp: '2026-03-18T09:34:08Z' },
  { id: 'e3', leadName: 'James Torres', type: 'reply', channel: 'SMS', message: '"Sounds good, call me!"', timestamp: '2026-03-18T09:41:00Z' },
  { id: 'e4', leadName: 'Ana Rivera', type: 'email_sent', channel: 'Email', message: 'Follow-up email sent', timestamp: '2026-03-18T10:05:12Z' },
  { id: 'e5', leadName: 'Ana Rivera', type: 'booked', channel: 'Calendar', message: 'Appointment booked for Mar 20', timestamp: '2026-03-18T10:22:00Z' },
  { id: 'e6', leadName: 'Mike Johnson', type: 'lead_created', channel: 'Tally', message: 'New lead submitted via form', timestamp: '2026-03-18T10:50:00Z' },
  { id: 'e7', leadName: 'Emily Watson', type: 'booked', channel: 'Calendar', message: 'Appointment booked for Mar 19', timestamp: '2026-03-18T12:48:00Z' },
]

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const EVENT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  sms_sent: { bg: 'bg-blue-100', text: 'text-[#2563eb]', label: 'SMS Sent' },
  email_sent: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Email Sent' },
  reply: { bg: 'bg-orange-100', text: 'text-[#f97316]', label: 'Replied' },
  booked: { bg: 'bg-green-100', text: 'text-green-700', label: 'Booked' },
  lead_created: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'New Lead' },
}

const STATUS_STYLES: Record<string, string> = {
  New: 'bg-gray-100 text-gray-600',
  Contacted: 'bg-blue-100 text-blue-700',
  Replied: 'bg-orange-100 text-orange-700',
  Booked: 'bg-green-100 text-green-700',
  'No Response': 'bg-red-50 text-red-500',
}

function mapAirtableLeads(records: AirtableLead[]): Lead[] {
  return records.map(r => ({
    id: r.id,
    name: normalizeLeadName(r),
    phone: r.fields.Phone || '',
    email: r.fields.Email || '',
    status: r.fields.Status || 'New',
    source: r.fields.Source || 'Unknown',
    createdAt: r.fields.CreatedAt || new Date().toISOString(),
  }))
}

function mapAirtableEvents(records: AirtableEvent[]): Event[] {
  return records.map(r => ({
    id: r.id,
    leadName: r.fields.LeadName || 'Unknown',
    type: r.fields.Type || 'unknown',
    channel: r.fields.Channel || '',
    message: r.fields.Message || '',
    timestamp: r.fields.Timestamp || new Date().toISOString(),
  }))
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS)
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS)
  const [airtableConnected, setAirtableConnected] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const connected = isAirtableConfigured()
    setAirtableConnected(connected)

    if (connected) {
      setLoading(true)
      Promise.all([fetchLeads(), fetchEvents()])
        .then(([leadRecords, eventRecords]) => {
          if (leadRecords.length > 0) setLeads(mapAirtableLeads(leadRecords))
          if (eventRecords.length > 0) setEvents(mapAirtableEvents(eventRecords))
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [])

  const total = leads.length
  const contacted = leads.filter(l => ['Contacted', 'Replied', 'Booked'].includes(l.status)).length
  const replies = leads.filter(l => ['Replied', 'Booked'].includes(l.status)).length
  const booked = leads.filter(l => l.status === 'Booked').length

  const contactRate = total > 0 ? Math.round((contacted / total) * 100) : 0
  const replyRate = contacted > 0 ? Math.round((replies / contacted) * 100) : 0
  const bookRate = replies > 0 ? Math.round((booked / replies) * 100) : 0
  const healthScore = Math.round((contactRate * 0.4) + (replyRate * 0.35) + (bookRate * 0.25))

  const KPI_CARDS = [
    { label: 'Leads Today', value: total, sub: '+12% vs yesterday', color: 'text-[#2563eb]', icon: '👥' },
    { label: 'Contacted', value: contacted, sub: `${contactRate}% contact rate`, color: 'text-blue-600', icon: '📤' },
    { label: 'Replies', value: replies, sub: `${replyRate}% reply rate`, color: 'text-[#f97316]', icon: '💬' },
    { label: 'Booked', value: booked, sub: `${bookRate}% conversion`, color: 'text-green-600', icon: '📅' },
  ]

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {loading && <span className="text-xs text-[#2563eb]">Loading live data…</span>}
            {airtableConnected && !loading && (
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">Airtable Live</span>
            )}
          </p>
        </div>
        {!airtableConnected && (
          <Link
            to="/admin/integrations"
            className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Connect Airtable for live data
          </Link>
        )}
      </div>

      {/* HEALTH BAR */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-900">Pipeline Health</h2>
            <p className="text-xs text-gray-500 mt-0.5">Overall score based on contact, reply, and booking rates</p>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-extrabold ${healthScore >= 70 ? 'text-green-600' : healthScore >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
              {healthScore}
            </span>
            <span className="text-gray-400 text-lg">/100</span>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${healthScore >= 70 ? 'bg-green-500' : healthScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${healthScore}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400">Poor</span>
          <span className="text-xs text-gray-400">Excellent</span>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map(card => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                <p className={`text-3xl font-extrabold mt-1 ${card.color}`}>{card.value}</p>
              </div>
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* FUNNEL */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-5">Conversion Funnel</h3>
        <div className="space-y-3">
          {[
            { label: 'Total Leads', count: total, pct: 100, color: 'bg-[#1e3a8a]' },
            { label: 'Contacted', count: contacted, pct: contactRate, color: 'bg-[#2563eb]' },
            { label: 'Replied', count: replies, pct: replyRate, color: 'bg-[#f97316]' },
            { label: 'Booked', count: booked, pct: bookRate, color: 'bg-green-500' },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-4">
              <div className="w-28 text-sm text-gray-600 shrink-0">{row.label}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className={`${row.color} h-2.5 rounded-full transition-all duration-700`} style={{ width: `${row.pct}%` }} />
              </div>
              <div className="w-20 text-right text-sm text-gray-600 shrink-0">
                {row.count} <span className="text-gray-400">({row.pct}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RECENT LEADS */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Leads</h3>
            <Link to="/admin/campaigns" className="text-xs text-[#2563eb] hover:text-[#1e3a8a]">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {leads.slice(0, 5).map(lead => (
              <div key={lead.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-[#1e3a8a] text-white text-sm flex items-center justify-center font-semibold shrink-0">
                  {lead.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{lead.name}</div>
                  <div className="text-xs text-gray-400">{lead.source} • {timeAgo(lead.createdAt)}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_STYLES[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* EVENT LOG */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Live Event Log</h3>
            <Link to="/admin/logs" className="text-xs text-[#2563eb] hover:text-[#1e3a8a]">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {events.slice(0, 7).map(ev => {
              const style = EVENT_STYLES[ev.type] || { bg: 'bg-gray-100', text: 'text-gray-600', label: ev.type }
              return (
                <div key={ev.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 mt-0.5 ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-700 truncate">{ev.leadName}</div>
                    <div className="text-xs text-gray-400 truncate">{ev.message}</div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 mt-0.5">{timeAgo(ev.timestamp)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
