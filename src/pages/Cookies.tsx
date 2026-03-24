// COMPONENT: Static cookie policy page
// FLOW: No API calls — informational legal page linked from the site footer
import { Link } from 'react-router-dom'
import logoImg from '../assets/logo-icon.png'

export default function Cookies() {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Cookie Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: March 2025</p>
        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          <p>BidBack uses cookies and similar tracking technologies to enhance your experience on our platform.</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">What Are Cookies</h2>
          <p>Cookies are small text files stored on your device when you visit a website. They help us remember your preferences and understand how you use our platform.</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Types of Cookies We Use</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Essential cookies:</strong> Required for the platform to function (authentication, session management).</li>
            <li><strong>Analytics cookies:</strong> Help us understand usage patterns so we can improve the product.</li>
            <li><strong>Preference cookies:</strong> Remember your settings and customizations.</li>
          </ul>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Managing Cookies</h2>
          <p>You can control cookies through your browser settings. Disabling certain cookies may affect platform functionality.</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contact</h2>
          <p>Questions? Contact us at <a href="mailto:privacy@bidback.io" className="text-[#2563eb] hover:underline">privacy@bidback.io</a>.</p>
        </div>
        <div className="mt-10">
          <Link to="/" className="text-sm text-[#2563eb] hover:underline">← Back to Home</Link>
        </div>
      </main>
    </div>
  )
}
