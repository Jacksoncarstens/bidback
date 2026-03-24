// COMPONENT: Campaign settings — SMS/email templates, timing, notifications, webhook tester
// FLOW: Reads/writes settings to localStorage; webhook tester POSTs to /api/send-sms and /api/send-email
// FEATURES: SMS template editor, email template editor, follow-up timing config, business hours, Slack/email notifications
import { useState } from 'react'

const STORAGE_KEY = 'leadly_settings'

interface SettingsData {
  smsTemplate: string
  emailSubject: string
  emailBody: string
  followUp1Hours: string
  followUp2Hours: string
  followUp3Hours: string
  maxFollowUps: string
  businessHoursStart: string
  businessHoursEnd: string
  timezone: string
  notifySlack: boolean
  notifyEmail: boolean
}

const DEFAULT_SETTINGS: SettingsData = {
  smsTemplate: "Hi {{first_name}}, this is {{agent_name}} from {{company}}! I just saw your inquiry about {{service}}. Are you available for a quick 5-min call today? Reply YES or call me at {{phone}}.",
  emailSubject: "Quick question about your {{service}} inquiry, {{first_name}}",
  emailBody: "Hi {{first_name}},\n\nThanks for reaching out! I wanted to personally follow up on your interest in {{service}}.\n\nI'd love to learn more about what you're looking for and see if we're a good fit. Are you free for a quick 10-minute call this week?\n\n[Book a time here: {{calendar_link}}]\n\nLooking forward to connecting!\n\n{{agent_name}}\n{{company}}",
  followUp1Hours: "1",
  followUp2Hours: "24",
  followUp3Hours: "72",
  maxFollowUps: "3",
  businessHoursStart: "09:00",
  businessHoursEnd: "18:00",
  timezone: "America/New_York",
  notifySlack: true,
  notifyEmail: false,
}

function loadSettings(): SettingsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(data: SettingsData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu', 'Europe/London',
  'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney',
]

const VARIABLES = ['{{first_name}}', '{{last_name}}', '{{company}}', '{{agent_name}}', '{{service}}', '{{phone}}', '{{calendar_link}}']

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>(loadSettings)
  const [activeTab, setActiveTab] = useState<'templates' | 'timing' | 'notifications' | 'webhook'>('templates')
  const [saved, setSaved] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookPayload, setWebhookPayload] = useState('{\n  "event": "lead.created",\n  "lead": {\n    "first_name": "Jane",\n    "last_name": "Doe",\n    "email": "jane@example.com",\n    "phone": "+15551234567"\n  }\n}')
  const [webhookResult, setWebhookResult] = useState<{ status: number; body: string } | null>(null)
  const [webhookLoading, setWebhookLoading] = useState(false)

  function set(key: keyof SettingsData, value: string | boolean) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function testWebhook() {
    if (!webhookUrl) return
    setWebhookLoading(true)
    setWebhookResult(null)
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: webhookPayload,
      })
      const text = await res.text()
      setWebhookResult({ status: res.status, body: text })
    } catch (err) {
      setWebhookResult({ status: 0, body: String(err) })
    } finally {
      setWebhookLoading(false)
    }
  }

  const TABS = [
    { id: 'templates', label: 'Message Templates' },
    { id: 'timing', label: 'Follow-Up Timing' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'webhook', label: 'Webhook Tester' },
  ] as const

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure templates, timing, and notification preferences.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-[#1e3a8a] text-[#1e3a8a]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
            <strong>Available variables:</strong>{' '}
            {VARIABLES.map(v => <code key={v} className="bg-blue-100 px-1 rounded text-xs mr-1">{v}</code>)}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
            <h3 className="font-semibold text-gray-900">SMS Template</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Initial SMS Message</label>
              <textarea
                value={settings.smsTemplate}
                onChange={e => set('smsTemplate', e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{settings.smsTemplate.length} / 320 characters</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
            <h3 className="font-semibold text-gray-900">Email Template</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Line</label>
              <input
                type="text"
                value={settings.emailSubject}
                onChange={e => set('emailSubject', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Body</label>
              <textarea
                value={settings.emailBody}
                onChange={e => set('emailBody', e.target.value)}
                rows={10}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent resize-none font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* TIMING */}
      {activeTab === 'timing' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
            <h3 className="font-semibold text-gray-900">Follow-Up Sequence</h3>
            <p className="text-sm text-gray-500">Set delays (in hours) between each follow-up touch.</p>
            {[
              { key: 'followUp1Hours', label: 'Follow-Up #1 (after lead created)' },
              { key: 'followUp2Hours', label: 'Follow-Up #2 (after #1)' },
              { key: 'followUp3Hours', label: 'Follow-Up #3 (after #2)' },
            ].map(row => (
              <div key={row.key} className="flex items-center gap-4">
                <label className="flex-1 text-sm text-gray-700">{row.label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={settings[row.key as keyof SettingsData] as string}
                    onChange={e => set(row.key as keyof SettingsData, e.target.value)}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                  />
                  <span className="text-sm text-gray-500">hours</span>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
              <label className="flex-1 text-sm font-medium text-gray-700">Maximum follow-ups</label>
              <div className="flex items-center gap-2">
                <select
                  value={settings.maxFollowUps}
                  onChange={e => set('maxFollowUps', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                >
                  {['1', '2', '3', '4', '5'].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
            <h3 className="font-semibold text-gray-900">Business Hours</h3>
            <p className="text-sm text-gray-500">Messages will only be sent during these hours.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={settings.businessHoursStart}
                  onChange={e => set('businessHoursStart', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time</label>
                <input
                  type="time"
                  value={settings.businessHoursEnd}
                  onChange={e => set('businessHoursEnd', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
              <select
                value={settings.timezone}
                onChange={e => set('timezone', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
              >
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Notification Channels</h3>
            <div className="space-y-4">
              {[
                { key: 'notifySlack', label: 'Slack Notifications', desc: 'Notify your Slack channel on new leads and replies.' },
                { key: 'notifyEmail', label: 'Email Notifications', desc: 'Send an email digest of daily lead activity.' },
              ].map(row => (
                <div key={row.key} className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg">
                  <input
                    type="checkbox"
                    id={row.key}
                    checked={settings[row.key as keyof SettingsData] as boolean}
                    onChange={e => set(row.key as keyof SettingsData, e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#1e3a8a]"
                  />
                  <label htmlFor={row.key} className="cursor-pointer">
                    <div className="text-sm font-medium text-gray-800">{row.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{row.desc}</div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WEBHOOK TESTER */}
      {activeTab === 'webhook' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
            <h3 className="font-semibold text-gray-900">Webhook Tester</h3>
            <p className="text-sm text-gray-500">Send a test POST request to any webhook URL to verify it's working.</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Webhook URL</label>
              <input
                type="url"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.example.com/your-webhook"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Payload (JSON)</label>
              <textarea
                value={webhookPayload}
                onChange={e => setWebhookPayload(e.target.value)}
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent resize-none"
              />
            </div>

            <button
              onClick={testWebhook}
              disabled={!webhookUrl || webhookLoading}
              className="bg-[#1e3a8a] text-white px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-blue-900 transition-colors"
            >
              {webhookLoading ? 'Sending...' : 'Send Test Request'}
            </button>

            {webhookResult && (
              <div className={`rounded-lg border p-4 ${webhookResult.status >= 200 && webhookResult.status < 300 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${webhookResult.status >= 200 && webhookResult.status < 300 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    HTTP {webhookResult.status || 'ERROR'}
                  </span>
                  <span className="text-xs text-gray-500">Response received</span>
                </div>
                <pre className="text-xs text-gray-700 bg-white rounded border border-gray-200 p-3 overflow-auto max-h-32">{webhookResult.body || '(empty body)'}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save button (not shown for webhook tab) */}
      {activeTab !== 'webhook' && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            className="bg-[#1e3a8a] text-white px-8 py-3 rounded-lg font-semibold text-sm hover:bg-blue-900 transition-colors"
          >
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  )
}
