// COMPONENT: Master view of all paying customers
// FLOW: Populated by Stripe webhook (stripe-webhook.ts) writing to Airtable Payments table
// DISPLAYS: All customer accounts — placeholder until Stripe signups begin
export default function MasterCustomers() {
  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="text-gray-500 text-sm mt-1">All paying contractors using BidBack.</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-gray-400 font-medium">No customers yet</p>
          <p className="text-gray-600 text-sm mt-1">Customers will appear here once they sign up and pay.</p>
        </div>
      </div>
    </div>
  )
}
