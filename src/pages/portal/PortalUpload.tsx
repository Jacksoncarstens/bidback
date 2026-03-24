// COMPONENT: CSV upload form for customer accounts
// FLOW: Check tier → if Free show upgrade gate → else allow upload
// GATE: Free tier blocked, paid tiers enforce lead limits
import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { getTier, isPaid, TIERS } from '../../lib/tiers'

const UPLOADS_KEY = 'bidback_uploads'

interface Upload {
  id: string
  filename: string
  count: number
  uploadedAt: string
  status: 'complete' | 'error'
}

function getSavedUploads(): Upload[] {
  try { return JSON.parse(localStorage.getItem(UPLOADS_KEY) || '[]') } catch { return [] }
}
function saveUpload(u: Upload) {
  localStorage.setItem(UPLOADS_KEY, JSON.stringify([u, ...getSavedUploads()]))
}
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function getPortalInfo() {
  try { return JSON.parse(localStorage.getItem('portalCustomer') || '{}') } catch { return {} }
}

export default function PortalUpload() {
  const [dragging, setDragging]     = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState(0)
  const [error, setError]           = useState<string | null>(null)
  const [uploads, setUploads]       = useState<Upload[]>(getSavedUploads)
  const [successCount, setSuccessCount] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const info   = getPortalInfo()
  const tier   = getTier(info.plan)
  const config = TIERS[tier]
  const paid   = isPaid(tier)

  // ── Free tier gate
  if (!paid) {
    return (
      <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Leads</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Import your leads and let BidBack handle the follow-up.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Upgrade to upload leads</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm mx-auto">
            You're on the Free plan. Upgrade to Starter or higher to upload leads and start recovering jobs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/#pricing"
              className="inline-block bg-[#1e3a8a] text-white font-semibold px-6 py-3 rounded-lg text-sm hover:bg-blue-900 transition-colors"
            >
              View Plans →
            </Link>
            <Link
              to="/cart?plan=ppa"
              className="inline-block bg-[#f97316] text-white font-semibold px-6 py-3 rounded-lg text-sm hover:bg-orange-600 transition-colors"
            >
              Upgrade to Starter — $150/mo
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {(['Starter', 'Pro', 'Enterprise'] as const).map(t => (
            <div key={t} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
              <div className="font-bold text-gray-900 dark:text-white text-sm mb-1">{t}</div>
              <div className="text-xs text-gray-500">{TIERS[t].leads.toLocaleString()} leads</div>
              <div className="text-xs font-semibold text-[#1e3a8a] mt-1">{TIERS[t].price}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Paid tier — show upload form
  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function processFile(file: File) {
    if (!file.name.endsWith('.csv')) { setError('Only CSV files are supported.'); return }
    setError(null); setUploading(true); setProgress(10)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (info.company) formData.append('accountId', info.company)
      setProgress(40)

      const authToken = localStorage.getItem('authToken')
      const headers: Record<string, string> = {}
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`

      const res = await fetch('/api/csv-upload', { method: 'POST', headers, body: formData })
      setProgress(80)

      const data = await res.json() as { count?: number; error?: string; limit?: number; used?: number }
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setProgress(100)

      const newUpload: Upload = {
        id: `u${Date.now()}`, filename: file.name,
        count: data.count || 0, uploadedAt: new Date().toISOString(), status: 'complete',
      }
      saveUpload(newUpload)
      setUploads(getSavedUploads())
      setTimeout(() => {
        setUploading(false)
        setProgress(0)
        setSuccessCount(data.count || 0)
        setTimeout(() => setSuccessCount(null), 8000)
      }, 600)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
      setUploading(false); setProgress(0)
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Leads</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Import a CSV file with your leads. We handle the follow-up automatically.</p>
        </div>
        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-medium shrink-0">
          {tier} · {config.leads.toLocaleString()} leads/mo
        </span>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        } ${dragging
          ? 'border-[#1e3a8a] bg-blue-50 dark:bg-blue-900/10'
          : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-[#1e3a8a] hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
        <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#1e3a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <p className="text-gray-700 dark:text-gray-300 font-semibold text-sm">
          {dragging ? 'Drop your CSV here' : 'Drag & drop a CSV file, or click to browse'}
        </p>
        <p className="text-xs text-gray-400 mt-2">CSV format: Name, Phone, Email</p>
      </div>

      {successCount !== null && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-5 py-4 flex items-start gap-4 animate-scale-in">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
              {successCount} leads imported successfully!
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
              Outreach starts within minutes. Check your dashboard for live status.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {uploading && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploading...</span>
            <span className="text-sm font-bold text-[#2563eb]">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
            <div className="bg-[#1e3a8a] h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">Processing leads and scheduling follow-ups...</p>
        </div>
      )}

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
        <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-sm mb-2">CSV Format</h3>
        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 font-mono text-xs text-gray-600 dark:text-gray-400 border border-amber-100 dark:border-amber-900">
          Name, Phone, Email<br />
          John Smith, +15551234567, john@example.com
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Past Uploads</h2>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
          {uploads.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">No uploads yet.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {uploads.map(u => (
                <div key={u.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[#2563eb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 dark:text-white truncate">{u.filename}</div>
                    <div className="text-xs text-gray-400">{u.count} leads · {timeAgo(u.uploadedAt)}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700 shrink-0">Complete</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
