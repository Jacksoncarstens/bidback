// COMPONENT: Customer portal replies view
// FLOW: Fetches leads from /api/get-leads, filters to those who replied (Interested / Not Interested)
// DISPLAYS: Tabs — Interested, Not Interested, All Replies
import { useState, useEffect } from 'react'

interface Lead {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  status: string
  createdAt: string
}

type Tab = 'all' | 'interested' | 'not_interested'

function getAccountId() {
  try {
    const info = JSON.parse(localStorage.getItem('portalCustomer') || '{}')
    return info.contractor_id || info.company || info.name || ''
  } catch { return '' }
}

const REPLIED_STATUSES = new Set(['Interested', 'Not Interested', 'Replied'])

function statusBadge(status: string) {
  if (status === 'Interested')    return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
  if (status === 'Not Interested') return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
}

function intial(lead: Lead) {
  return (lead.firstName || lead.lastName || '?')[0].toUpperCase()
}

function displayName(lead: Lead) {
  return [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Unknown'
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function PortalReplies() {
  const [leads, setLeads]       = useState<Lead[]>([])
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('all')

  useEffect(() => {
    const accountId = getAccountId()
    if (!accountId) { setLoading(false); return }

    const authToken = localStorage.getItem('authToken')
    const headers: Record<string, string> = {}
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`

    fetch(`/api/get-leads?accountId=${encodeURIComponent(accountId)}`, { headers })
      .then(r => r.json())
      .then((data: { leads?: Lead[] }) => {
        const replied = (data.leads || []).filter(l => REPLIED_STATUSES.has(l.status))
        setLeads(replied)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const interested    = leads.filter(l => l.status === 'Interested')
  const notInterested = leads.filter(l => l.status === 'Not Interested')

  const tabs = [
    { key: 'all' as Tab,           label: `All Replies`,     count: leads.length },
    { key: 'interested' as Tab,    label: `Interested`,      count: interested.length },
    { key: 'not_interested' as Tab,label: `Not Interested`,  count: notInterested.length },
  ]

  const visible =
    activeTab === 'interested'    ? interested :
    activeTab === 'not_interested' ? notInterested :
    leads

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Replies</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Leads who responded to your follow-ups.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Replies',   val: leads.length,          color: 'text-[#2563eb]' },
          { label: 'Interested',      val: interested.length,     color: 'text-[#f97316]' },
          { label: 'Not Interested',  val: notInterested.length,  color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {/* Tab bar */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex gap-1 flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#1e3a8a] text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-xs ${activeTab === tab.key ? 'opacity-70' : 'opacity-50'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl mb-4">💬</div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {leads.length === 0 ? 'No replies yet' : 'None in this category'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              {leads.length === 0
                ? 'When leads respond to your messages, they\'ll show up here.'
                : 'Try a different tab to see other replies.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {visible.map(lead => (
              <div key={lead.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {intial(lead)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                    {displayName(lead)}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Replied {timeAgo(lead.createdAt)}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${statusBadge(lead.status)}`}>
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
