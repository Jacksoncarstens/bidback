// COMPONENT: Integration configuration panel with slide-over settings panels
// FLOW: Reads/writes integration credentials to localStorage via src/lib/integrations.ts
// DISPLAYS: 9 integration cards (Airtable, Stripe, Twilio, Make.com, Resend, Tally, Slack, Cal.com, Zapier)
// FEATURES: Connected/disconnected badge per integration, slide-over config panel, field save
import { useState, useEffect } from 'react'
import { getIntegrationConfig, updateIntegration, isIntegrationConnected, IntegrationConfig } from '../lib/integrations'

type IntKey = keyof IntegrationConfig

interface IntegrationDef {
  key: IntKey
  name: string
  description: string
  logo: string
  color: string
  fields: { name: string; label: string; placeholder: string; type?: string }[]
  docsUrl?: string
}

const INTEGRATIONS: IntegrationDef[] = [
  {
    key: 'airtable',
    name: 'Airtable',
    description: 'Store and sync leads, campaign data, and event logs.',
    logo: '🗂️',
    color: 'bg-yellow-50 border-yellow-200',
    fields: [
      { name: 'apiKey', label: 'API Key', placeholder: 'key…', type: 'password' },
      { name: 'baseId', label: 'Base ID', placeholder: 'appXXXXXXXXXXXXXX' },
      { name: 'tableName', label: 'Table Name', placeholder: 'Leads' },
    ],
  },
  {
    key: 'stripe',
    name: 'Stripe',
    description: 'Accept payments and handle subscription billing.',
    logo: '💳',
    color: 'bg-purple-50 border-purple-200',
    fields: [
      { name: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_live_…' },
      { name: 'webhookSecret', label: 'Webhook Secret', placeholder: 'whsec_…', type: 'password' },
    ],
  },
  {
    key: 'twilio',
    name: 'Twilio',
    description: 'Send SMS, voice calls, and ringless voicemail drops.',
    logo: '📱',
    color: 'bg-red-50 border-red-200',
    fields: [
      { name: 'accountSid', label: 'Account SID', placeholder: 'ACxxxxxxxxxxxxxxxx' },
      { name: 'authToken', label: 'Auth Token', placeholder: '…', type: 'password' },
      { name: 'fromNumber', label: 'From Number', placeholder: '+15551234567' },
    ],
  },
  {
    key: 'make',
    name: 'Make.com',
    description: 'Trigger automation scenarios via webhook.',
    logo: '⚙️',
    color: 'bg-violet-50 border-violet-200',
    fields: [
      { name: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://hook.eu1.make.com/…' },
    ],
  },
  {
    key: 'resend',
    name: 'Resend',
    description: 'Send transactional and drip emails to leads.',
    logo: '✉️',
    color: 'bg-blue-50 border-blue-200',
    fields: [
      { name: 'apiKey', label: 'API Key', placeholder: 're_…', type: 'password' },
      { name: 'fromEmail', label: 'From Email', placeholder: 'hello@yourdomain.com' },
    ],
  },
  {
    key: 'tally',
    name: 'Tally.so',
    description: 'Receive lead intake form submissions via webhook.',
    logo: '📋',
    color: 'bg-green-50 border-green-200',
    fields: [
      { name: 'webhookSecret', label: 'Webhook Secret', placeholder: 'ts_…', type: 'password' },
      { name: 'formId', label: 'Form ID', placeholder: 'mXXXXXX' },
    ],
  },
  {
    key: 'zapier',
    name: 'Zapier',
    description: 'Connect Leadly to 5,000+ apps via Zapier webhooks.',
    logo: '⚡',
    color: 'bg-orange-50 border-orange-200',
    fields: [
      { name: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://hooks.zapier.com/…' },
    ],
  },
  {
    key: 'slack',
    name: 'Slack',
    description: 'Get real-time notifications on new leads and replies.',
    logo: '💬',
    color: 'bg-pink-50 border-pink-200',
    fields: [
      { name: 'webhookUrl', label: 'Incoming Webhook URL', placeholder: 'https://hooks.slack.com/…' },
      { name: 'channel', label: 'Channel', placeholder: '#leads' },
    ],
  },
  {
    key: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts and deals to your HubSpot CRM.',
    logo: '🧲',
    color: 'bg-amber-50 border-amber-200',
    fields: [
      { name: 'apiKey', label: 'API Key', placeholder: 'pat-…', type: 'password' },
      { name: 'portalId', label: 'Portal ID', placeholder: '12345678' },
    ],
  },
]

export default function Integrations() {
  const [open, setOpen] = useState<IntegrationDef | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [connected, setConnected] = useState<Record<IntKey, boolean>>({} as Record<IntKey, boolean>)

  useEffect(() => {
    const status = {} as Record<IntKey, boolean>
    INTEGRATIONS.forEach(i => { status[i.key] = isIntegrationConnected(i.key) })
    setConnected(status)
  }, [])

  function openPanel(intg: IntegrationDef) {
    const config = getIntegrationConfig()
    const section = config[intg.key] as Record<string, string>
    setFormValues({ ...section })
    setSaved(false)
    setOpen(intg)
  }

  function closePanel() {
    setOpen(null)
  }

  function handleChange(name: string, value: string) {
    setFormValues(prev => ({ ...prev, [name]: value }))
  }

  function handleSave() {
    if (!open) return
    updateIntegration(open.key, formValues as never)
    setSaved(true)
    setConnected(prev => ({
      ...prev,
      [open.key]: Object.values(formValues).some(v => v.trim() !== ''),
    }))
    setTimeout(() => setSaved(false), 2000)
  }

  function handleDisconnect() {
    if (!open) return
    const empty: Record<string, string> = {}
    open.fields.forEach(f => { empty[f.name] = '' })
    updateIntegration(open.key, empty as never)
    setConnected(prev => ({ ...prev, [open.key]: false }))
    setFormValues(empty)
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-500 mt-1">Connect Leadly to your tools. Configuration is stored locally.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {INTEGRATIONS.map(intg => (
          <div
            key={intg.key}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-3"
            onClick={() => openPanel(intg)}
          >
            <div className="flex items-start justify-between">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl ${intg.color}`}>
                {intg.logo}
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                connected[intg.key]
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {connected[intg.key] ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{intg.name}</h3>
              <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{intg.description}</p>
            </div>
            <button
              className="mt-auto text-sm font-medium text-[#2563eb] hover:text-[#1e3a8a] transition-colors text-left"
              onClick={e => { e.stopPropagation(); openPanel(intg) }}
            >
              Configure →
            </button>
          </div>
        ))}
      </div>

      {/* SLIDE-OVER PANEL */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={closePanel} />
          <div className="relative ml-auto w-full max-w-md bg-white shadow-2xl flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{open.logo}</span>
                <div>
                  <h2 className="font-bold text-gray-900">{open.name}</h2>
                  <p className="text-xs text-gray-500">{open.description}</p>
                </div>
              </div>
              <button onClick={closePanel} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div className={`rounded-lg border p-4 text-sm flex items-center gap-2 ${
                connected[open.key]
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}>
                <span className={`w-2 h-2 rounded-full ${connected[open.key] ? 'bg-green-500' : 'bg-gray-400'}`} />
                {connected[open.key] ? 'Integration is connected and active.' : 'Not configured. Enter your credentials below.'}
              </div>

              {open.fields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    value={formValues[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent placeholder-gray-400"
                  />
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-gray-100 flex gap-3">
              {connected[open.key] && (
                <button
                  onClick={handleDisconnect}
                  className="flex-1 border border-red-200 text-red-600 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  Disconnect
                </button>
              )}
              <button
                onClick={handleSave}
                className="flex-1 bg-[#1e3a8a] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-900 transition-colors"
              >
                {saved ? '✓ Saved!' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
