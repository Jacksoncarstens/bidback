// COMPONENT: Customer portal dashboard
// Shows tier status, upgrade CTA for Free tier, drip sequence status, stats with tabs, activity
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTier, isPaid, TIERS } from '../../lib/tiers'

const WELCOME_KEY = 'bidback_welcome_seen'

// ── Drip sequence config (mirrors api/cron/drip-sequence.ts) ─────────────────
const SEQUENCE_DAYS: Record<string, number> = { Free: 0, Starter: 6, Pro: 7, Enterprise: 8 }

function getBatchInfo(totalLeads: number, tier: string, uploadDateIso: string) {
  if (!uploadDateIso || !totalLeads) return null
  const day = Math.floor((Date.now() - new Date(uploadDateIso).getTime()) / 86400000) + 1
  const maxDays = SEQUENCE_DAYS[tier] || 0
  if (maxDays === 0 || day > maxDays) return null
  const batchSize = Math.ceil(totalLeads / 5)
  // rough "which batch goes today" — day maps to a batch in the sequence
  const batchToday = Math.min(day, 5)
  return { day, maxDays, batchSize, batchToday }
}

interface Lead {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  status: string
  createdAt: string
}

export default function PortalDashboard() {
  const [showWelcome, setShowWelcome]       = useState(false)
  const [leads, setLeads]                   = useState<Lead[]>([])
  const [activeTab, setActiveTab]           = useState<'all' | 'interested' | 'not_interested'>('all')
  const [loadingLeads, setLoadingLeads]     = useState(false)

  const raw  = localStorage.getItem('portalCustomer')
  const info = raw ? JSON.parse(raw) as {
    name?: string; company?: string; plan?: string; email?: string; contractor_id?: string
  } : {}
  const tier   = getTier(info.plan)
  const config = TIERS[tier]
  const paid   = isPaid(tier)

  useEffect(() => {
    if (!localStorage.getItem(WELCOME_KEY)) setShowWelcome(true)
  }, [])

  useEffect(() => {
    const accountId = info.contractor_id || info.company || info.name || ''
    if (!accountId) return
    setLoadingLeads(true)
    fetch(`/api/get-leads?accountId=${encodeURIComponent(accountId)}`)
      .then(r => r.json())
      .then((data: { leads?: Lead[] }) => setLeads(data.leads || []))
      .catch(() => {})
      .finally(() => setLoadingLeads(false))
  }, [])

  function dismissWelcome() {
    localStorage.setItem(WELCOME_KEY, '1')
    setShowWelcome(false)
  }

  // ── Derived stats ────────────────────────────────────────────────────────────
  const total       = leads.length
  const contacted   = leads.filter(l => ['Contacted','Replied','Booked','Interested','Not Interested'].includes(l.status)).length
  const interested  = leads.filter(l => l.status === 'Interested').length
  const notInterested = leads.filter(l => l.status === 'Not Interested').length
  const booked      = leads.filter(l => l.status === 'Booked').length
  const pct = config.leads > 0 ? Math.min(100, Math.round((total / config.leads) * 100)) : 0

  // Drip sequence info
  const earliestLead = leads.length > 0
    ? leads.slice().sort((a, b) => a.createdAt < b.createdAt ? -1 : 1)[0]
    : null
  const dripInfo = earliestLead ? getBatchInfo(total, tier, earliestLead.createdAt) : null

  // Tab-filtered leads (for Interested/Not Interested sections)
  const interestedLeads    = leads.filter(l => l.status === 'Interested')
  const notInterestedLeads = leads.filter(l => l.status === 'Not Interested')

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Free tier upgrade banner */}
      {!paid && (
        <div className="bg-gradient-to-br from-[#1e3a8a] to-blue-900 rounded-2xl p-8 text-white">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🚀</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">Upgrade to start recovering leads</h2>
              <p className="text-blue-200 text-sm mb-5">
                You're on the Free plan. Upgrade to Starter or higher to upload leads, trigger outreach, and start booking jobs.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <Link
                  to="/cart?plan=ppa"
                  className="inline-block bg-[#f97316] hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors"
                >
                  Starter — $150/mo →
                </Link>
                <Link to="/#pricing" className="text-blue-300 hover:text-white text-sm underline">
                  See all plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* One-time upload prompt for paid users */}
      {paid && showWelcome && (
        <div className="bg-gradient-to-br from-[#1e3a8a] to-blue-900 rounded-2xl p-8 text-white relative">
          <button onClick={dismissWelcome} className="absolute top-4 right-4 text-blue-300 hover:text-white text-xl leading-none">×</button>
          <div className="flex items-start gap-4">
            <div className="text-4xl">📋</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">Upload your first lead list to get started</h2>
              <p className="text-blue-200 text-sm mb-5">Got old leads, past quotes, or contacts that went cold? Upload a CSV and BidBack starts reaching out within seconds.</p>
              <div className="flex items-center gap-4">
                <Link to="/portal/upload" onClick={dismissWelcome} className="inline-block bg-[#f97316] hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors">
                  Upload Your Lead List →
                </Link>
                <button onClick={dismissWelcome} className="text-blue-300 hover:text-white text-sm underline">I'll do this later</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Leads Uploaded', val: total.toString(),         color: 'text-[#2563eb]',  accent: 'from-blue-50 dark:from-blue-950/30' },
          { label: 'Contacted',      val: contacted.toString(),     color: 'text-blue-500',   accent: 'from-blue-50 dark:from-blue-950/30' },
          { label: 'Interested',     val: interested.toString(),    color: 'text-[#f97316]',  accent: 'from-orange-50 dark:from-orange-950/30' },
          { label: 'Booked',         val: booked.toString(),        color: 'text-green-500',  accent: 'from-green-50 dark:from-green-950/30' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.accent} to-white dark:to-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-4 transition-shadow hover:shadow-sm`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Active drip campaign status */}
      {paid && total > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-semibold text-[#2563eb] uppercase tracking-widest">Active Drip Campaign</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                {total.toLocaleString()} leads · 5 batches
              </h3>
            </div>
            <span className="flex items-center gap-1.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-semibold px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Running
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">{dripInfo ? `Day ${dripInfo.day}` : '—'}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">of {dripInfo?.maxDays ?? SEQUENCE_DAYS[tier] ?? '?'}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-[#f97316]">
                {dripInfo ? `Batch ${dripInfo.batchToday}` : 'Pending'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">today's outreach</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-[#2563eb]">
                {dripInfo ? dripInfo.batchSize.toLocaleString() : '—'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">leads/batch</div>
            </div>
          </div>

          {earliestLead && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              Sequence started {new Date(earliestLead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' · '}{tier} plan · SMS{tier === 'Pro' || tier === 'Enterprise' ? ' + Voicemail' : ''}{tier === 'Enterprise' ? ' + Email' : ''}
            </p>
          )}
        </div>
      )}

      {/* Plan + usage */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-semibold text-[#f97316] uppercase tracking-widest">Current Plan</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
              {tier}
              {paid && <span className="text-sm font-normal text-gray-400 ml-2">{config.price}</span>}
            </h3>
          </div>
          <div className="text-right">
            {paid ? (
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                {config.leads.toLocaleString()} leads/mo
              </span>
            ) : (
              <Link to="/cart?plan=ppa" className="text-xs bg-[#f97316] text-white px-3 py-1 rounded-full font-semibold hover:bg-orange-600 transition-colors">
                Upgrade
              </Link>
            )}
          </div>
        </div>

        {paid ? (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Leads used</span>
              <span className={pct >= 90 ? 'text-red-500 font-semibold' : ''}>
                {total.toLocaleString()} / {config.leads.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : 'bg-[#1e3a8a]'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {pct >= 90 && (
              <p className="text-xs text-red-500 mt-1">
                Almost at your limit.{' '}
                <Link to="/#pricing" className="underline">Upgrade to get more leads.</Link>
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mt-2">
            {(['Starter', 'Pro', 'Enterprise'] as const).map(t => (
              <Link key={t} to={`/cart?plan=${t === 'Starter' ? 'ppa' : t === 'Pro' ? 'pro' : 'ent'}`}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center hover:border-[#1e3a8a] transition-colors">
                <div className="text-xs font-bold text-gray-900 dark:text-white">{t}</div>
                <div className="text-xs text-gray-400">{TIERS[t].leads.toLocaleString()} leads</div>
                <div className="text-xs font-semibold text-[#1e3a8a] mt-1">{TIERS[t].price}</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Upload CTA — only for paid */}
      {paid && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Upload more leads</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Add another CSV anytime — old quotes, new contacts, whatever you've got.</p>
          </div>
          <Link to="/portal/upload" className="shrink-0 bg-[#1e3a8a] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-900 transition-colors">
            + Upload CSV
          </Link>
        </div>
      )}

      {/* Lead activity tabs — Interested / Not Interested */}
      {paid && total > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Lead Status</h3>
            <div className="flex gap-1">
              {([
                { key: 'all',          label: `Awaiting Reply (${leads.filter(l => l.status === 'New' || l.status === 'Contacted').length})` },
                { key: 'interested',   label: `Interested (${interested})` },
                { key: 'not_interested', label: `Not Interested (${notInterested})` },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                    activeTab === tab.key
                      ? 'bg-[#1e3a8a] text-white'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loadingLeads ? (
            <div className="py-10 flex justify-center">
              <div className="w-5 h-5 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeTab === 'interested' ? (
            interestedLeads.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">No interested leads yet — outreach is running.</div>
            ) : (
              <LeadTable leads={interestedLeads} badge="Interested" badgeColor="bg-orange-100 text-orange-700" />
            )
          ) : activeTab === 'not_interested' ? (
            notInterestedLeads.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">No opt-outs yet.</div>
            ) : (
              <LeadTable leads={notInterestedLeads} badge="Not Interested" badgeColor="bg-gray-100 text-gray-500" />
            )
          ) : (
            // All leads
            leads.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">No leads yet. Upload a CSV to get started.</div>
            ) : (
              <LeadTable leads={leads.filter(l => l.status === 'New' || l.status === 'Contacted').slice(0, 20)} badge={null} badgeColor="" />
            )
          )}
        </div>
      )}

      {/* Empty state for new paid accounts */}
      {paid && total === 0 && !showWelcome && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-3xl mb-3">📭</div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No activity yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Upload your first lead list to get things moving.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Lead table sub-component ──────────────────────────────────────────────────
function LeadTable({ leads, badge, badgeColor }: {
  leads: Lead[]; badge: string | null; badgeColor: string
}) {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {leads.map(lead => (
        <div key={lead.id} className="flex items-center gap-4 px-5 py-3">
          <div className="w-8 h-8 rounded-full bg-[#1e3a8a]/10 text-[#1e3a8a] flex items-center justify-center text-xs font-bold shrink-0">
            {(lead.firstName || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
              {[lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Unknown'}
            </div>
            <div className="text-xs text-gray-400 truncate">{lead.phone || lead.email || '—'}</div>
          </div>
          {badge ? (
            <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${badgeColor}`}>{badge}</span>
          ) : (
            <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
              lead.status === 'Interested'     ? 'bg-orange-100 text-orange-700' :
              lead.status === 'Not Interested' ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' :
              lead.status === 'Contacted'      ? 'bg-blue-100 text-blue-700' :
              lead.status === 'Booked'         ? 'bg-green-100 text-green-700' :
              'bg-gray-50 text-gray-400'
            }`}>{lead.status || 'New'}</span>
          )}
        </div>
      ))}
    </div>
  )
}
