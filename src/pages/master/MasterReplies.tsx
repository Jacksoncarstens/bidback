// COMPONENT: All inbound SMS replies across every customer account
// FLOW: Populated by twilio-reply.ts webhook writing reply events to Airtable Events table
// DISPLAYS: Lead replies from Twilio — placeholder until replies start arriving
export default function MasterReplies() {
  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Replies</h1>
        <p className="text-gray-500 text-sm mt-1">All lead replies across every customer account.</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-gray-400 font-medium">No replies yet</p>
          <p className="text-gray-600 text-sm mt-1">When leads reply to follow-up messages, they'll show up here.</p>
        </div>
      </div>
    </div>
  )
}
