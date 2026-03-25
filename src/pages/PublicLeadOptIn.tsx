import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function PublicLeadOptIn() {
  const [params] = useSearchParams()
  const contractorName = params.get('contractorName') || 'Your Contractor'
  const [checked, setChecked] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're opted in!</h1>
          <p className="text-gray-600 text-sm mb-6">
            You've confirmed consent to receive SMS, email, and voicemail messages from <span className="font-semibold">{contractorName}</span>.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 font-semibold text-sm mb-1">📸 Screenshot this for proof</p>
            <p className="text-amber-700 text-xs">
              Take a screenshot of this confirmation page. It serves as your record of consent and may be requested by your contractor.
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-5">
            Consented on {new Date().toLocaleString()} — {contractorName}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Opt-In to Messages from {contractorName}</h1>
          <p className="text-gray-600 text-sm mt-3">
            By opting in, you agree to receive follow-up communications from <span className="font-semibold">{contractorName}</span> regarding your recent inquiry. These messages may include:
          </p>
          <ul className="mt-3 space-y-1 text-sm text-gray-600 list-none">
            <li className="flex items-center gap-2">
              <span className="text-[#1e3a8a]">✓</span> SMS text messages
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#1e3a8a]">✓</span> Email messages
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#1e3a8a]">✓</span> Voicemail messages
            </li>
          </ul>
          <p className="text-gray-500 text-xs mt-4">
            Message and data rates may apply. You may opt out at any time by replying STOP to any SMS or contacting the contractor directly.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer mb-6 p-4 rounded-xl border border-gray-200 hover:border-[#1e3a8a] hover:bg-blue-50 transition-colors">
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#1e3a8a] accent-[#1e3a8a] shrink-0"
          />
          <span className="text-sm text-gray-700 font-medium">
            I consent to receive SMS, email, and voicemail messages from {contractorName} regarding my inquiry.
          </span>
        </label>

        <button
          onClick={() => setConfirmed(true)}
          disabled={!checked}
          className="w-full bg-[#1e3a8a] text-white font-semibold py-3 rounded-lg text-sm hover:bg-blue-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Confirm Opt-In
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          Powered by BidBack · Your information is never shared or sold.
        </p>
      </div>
    </div>
  )
}
