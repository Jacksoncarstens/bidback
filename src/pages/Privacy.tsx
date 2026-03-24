// COMPONENT: Static privacy policy page
// FLOW: No API calls — informational legal page linked from the site footer
import { Link } from 'react-router-dom'
import logoImg from '../assets/logo-icon.png'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="BidBack" className="h-8 w-auto" />
            <span className="font-bold text-xl text-gray-900 dark:text-white">BidBack</span>
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: March 2025</p>
        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          <p>BidBack ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Information We Collect</h2>
          <p>We collect information you provide directly, such as your name, email address, and business details when you register or use our services. We also collect usage data, log files, and information from integrations you connect (e.g., Airtable, CRM tools).</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">How We Use Your Information</h2>
          <p>We use collected information to provide and improve our services, send transactional communications, process payments, and comply with legal obligations. We do not sell your personal data to third parties.</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Retention</h2>
          <p>We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your data at any time by contacting us.</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contact</h2>
          <p>For privacy-related questions, contact us at <a href="mailto:privacy@bidback.io" className="text-[#2563eb] hover:underline">privacy@bidback.io</a>.</p>
        </div>
        <div className="mt-10">
          <Link to="/" className="text-sm text-[#2563eb] hover:underline">← Back to Home</Link>
        </div>
      </main>
    </div>
  )
}
