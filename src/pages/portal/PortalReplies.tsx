// COMPONENT: Customer portal replies view
// FLOW: Populated when leads reply to SMS — events recorded by twilio-reply.ts webhook
// DISPLAYS: Leads who responded to follow-up messages for the logged-in account
export default function PortalReplies() {
  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Replies</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Leads who responded to your follow-ups.</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No replies yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">When leads respond to your messages, they'll show up here.</p>
        </div>
      </div>
    </div>
  )
}
