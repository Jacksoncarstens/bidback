import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function PublicLeadOptIn() {
  const [params] = useSearchParams()
  const contractorName = params.get('contractorName') || 'Your Contractor'
  const [checked, setChecked] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const consentTime = new Date().toLocaleString()

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#030712' }}>
        <div className="w-full max-w-[500px]">
          {/* Logo */}
          <div className="text-center mb-8">
            <span className="text-2xl font-bold tracking-tight" style={{ color: '#6D8196' }}>BidBack</span>
          </div>

          {/* Confirmation card */}
          <div className="rounded-2xl p-8" style={{ backgroundColor: '#111111', border: '1px solid #333333' }}>
            {/* Checkmark */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#052e16' }}>
                <svg className="w-7 h-7" style={{ color: '#10B981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">Consent Confirmed</h1>
            </div>

            {/* Consent summary box */}
            <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: '#1A1A1A', border: '1px solid #333333' }}>
              <p className="text-white font-semibold text-sm mb-3">You have consented to receive:</p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <span style={{ color: '#10B981' }}>✓</span>
                  SMS messages from <span className="font-semibold text-white ml-1">{contractorName}</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <span style={{ color: '#10B981' }}>✓</span>
                  Voicemail messages from <span className="font-semibold text-white ml-1">{contractorName}</span>
                </li>
              </ul>
              <p className="text-gray-400 text-sm">About project inquiries, quotes, and service updates</p>
            </div>

            {/* Legal text */}
            <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: '#0d0d0d', border: '1px solid #222222' }}>
              <p className="text-gray-400 text-xs leading-relaxed">
                I consent to receive SMS and voicemail messages from {contractorName} regarding project inquiries,
                quotes, and service updates. Carrier message and data rates may apply. Reply STOP to opt out.
              </p>
              <p className="text-gray-600 text-xs mt-2">Consented: {consentTime}</p>
            </div>

            {/* Screenshot button */}
            <button
              onClick={() => window.print()}
              className="w-full font-semibold py-3 px-6 rounded-lg text-white text-sm mb-2 transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#6D8196' }}
            >
              Take a Screenshot of This Page
            </button>
            <p className="text-center text-xs mb-4" style={{ color: '#6b7280' }}>
              You'll need this as proof of your consent for {contractorName}
            </p>

            {/* Done button */}
            <button
              onClick={() => window.close()}
              className="w-full font-medium py-3 px-6 rounded-lg text-sm transition-colors"
              style={{ backgroundColor: '#1A1A1A', border: '1px solid #333333', color: '#9ca3af' }}
            >
              Done
            </button>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: '#4b5563' }}>
            Powered by BidBack · Your information is never shared or sold.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#030712' }}>
      <div className="w-full max-w-[500px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold tracking-tight" style={{ color: '#6D8196' }}>BidBack</span>
          <p className="text-gray-500 text-sm mt-1">Message Consent</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl p-8" style={{ backgroundColor: '#111111', border: '1px solid #333333' }}>
          {/* Company name */}
          <div className="mb-6">
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Consent requested by</p>
            <h2 className="text-2xl font-bold text-white">{contractorName}</h2>
          </div>

          <div className="mb-6" style={{ borderTop: '1px solid #333333' }} />

          {/* Consent text */}
          <div className="mb-6">
            <p className="text-gray-300 text-sm leading-relaxed">
              By checking the box below, I consent to receive SMS and voicemail messages
              from <span className="font-semibold text-white">{contractorName}</span> regarding
              project inquiries, quotes, and service updates.
            </p>
            <p className="text-gray-500 text-xs mt-3">
              Carrier message and data rates may apply. Reply STOP to opt out.
            </p>
          </div>

          {/* Checkbox */}
          <label
            className="flex items-start gap-3 cursor-pointer mb-6 p-4 rounded-xl transition-colors"
            style={{
              border: checked ? '1px solid #6D8196' : '1px solid #333333',
              backgroundColor: checked ? '#0f1a22' : '#1A1A1A',
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0"
              style={{ accentColor: '#6D8196' }}
            />
            <span className="text-sm text-gray-300 font-medium leading-snug">
              I consent to receive SMS and voicemail messages from {contractorName}
            </span>
          </label>

          {/* Submit button */}
          <button
            onClick={() => setConfirmed(true)}
            disabled={!checked}
            className="w-full font-semibold py-3 px-6 rounded-lg text-white text-sm transition-opacity"
            style={{
              backgroundColor: '#6D8196',
              opacity: checked ? 1 : 0.4,
              cursor: checked ? 'pointer' : 'not-allowed',
            }}
          >
            Confirm Consent
          </button>

          {/* Footer */}
          <p className="text-center text-xs mt-5" style={{ color: '#4b5563' }}>
            This opt-in is required by federal messaging regulations
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#4b5563' }}>
          Powered by BidBack · Your information is never shared or sold.
        </p>
      </div>
    </div>
  )
}
