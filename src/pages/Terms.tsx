// COMPONENT: Static terms of service page
// FLOW: No API calls — informational legal page linked from the site footer
import { Link } from 'react-router-dom'
import logoImg from '../assets/logo-icon.png'

export default function Terms() {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: March 2025</p>
        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          <p>By accessing or using BidBack, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Use of Service</h2>
          <p>You agree to use BidBack only for lawful purposes and in accordance with applicable laws and regulations, including those governing SMS and email marketing (TCPA, CAN-SPAM, etc.). You are responsible for ensuring you have consent from leads before contacting them.</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately of any unauthorized use.</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payments</h2>
          <p>Subscription fees are billed monthly. All payments are processed securely via Stripe. Refunds are handled on a case-by-case basis — contact support within 7 days of a charge.</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms, engage in abusive behavior, or breach applicable laws.</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contact</h2>
          <p>Questions? Reach us at <a href="mailto:support@bidback.io" className="text-[#2563eb] hover:underline">support@bidback.io</a>.</p>
        </div>
        <div className="mt-10">
          <Link to="/" className="text-sm text-[#2563eb] hover:underline">← Back to Home</Link>
        </div>
      </main>
    </div>
  )
}
