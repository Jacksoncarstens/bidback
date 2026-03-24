// COMPONENT: Master admin settings and configuration panel
// FLOW: Links to /api/health for env var status, links to Make.com and Vercel for config
// FEATURES: API health check, SMS template info (managed in Make.com), env var management
export default function MasterSettings() {
  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">System configuration and API status.</p>
      </div>

      {/* System Health */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-4">API Health Check</h2>
        <p className="text-gray-500 text-sm mb-4">Check which integrations are configured and working.</p>
        <a
          href="/api/health"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#1e3a8a] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-900 transition-colors"
        >
          View System Health →
        </a>
      </div>

      {/* SMS Templates */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-2">SMS Templates</h2>
        <p className="text-gray-500 text-sm mb-4">Follow-up message templates are configured in Make.com. Go to your scenario to edit message content.</p>
        <a
          href="https://make.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Open Make.com →
        </a>
      </div>

      {/* Env Vars */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-2">Environment Variables</h2>
        <p className="text-gray-500 text-sm mb-4">All API keys are managed in Vercel. Use the health check to verify what's configured.</p>
        <a
          href="https://vercel.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Open Vercel Dashboard →
        </a>
      </div>
    </div>
  )
}
