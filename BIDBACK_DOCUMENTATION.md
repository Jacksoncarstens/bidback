# BIDBACK — COMPLETE SYSTEM DOCUMENTATION
**Last Updated:** 2026-03-24
**Status:** Live (446 leads, 1 customer — Eric, Pro tier; SMS/voicemail pending Twilio verification)

---

## TABLE OF CONTENTS
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Current Status](#2-current-status)
3. [How It Works](#3-how-it-works)
4. [Customer Workflow](#4-customer-workflow)
5. [Integrations](#5-integrations)
6. [Airtable Schema](#6-airtable-schema)
7. [Frontend Pages](#7-frontend-pages)
8. [Authentication](#8-authentication)
9. [Pricing](#9-pricing)
10. [Cron Jobs](#10-cron-jobs)
11. [Drip Campaign System](#11-drip-campaign-system)
12. [Voicemail Generation](#12-voicemail-generation)
13. [Reply Parsing](#13-reply-parsing)
14. [Code Locations](#14-code-locations)
15. [Environment Variables](#15-environment-variables)
16. [Deployment](#16-deployment)
17. [Design System](#17-design-system)
18. [Notes](#18-notes)

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

BidBack is a multi-tenant SaaS platform that automates lead follow-up for contractors. A contractor signs up, uploads a CSV of lost bids (leads), and the system automatically contacts each lead via SMS, voicemail drop, and/or email over a 5-day drip sequence.

```
Contractor Signs Up
        │
        ▼
Firebase Auth → Airtable Contractors record created
        │
        ▼
Upload CSV (leads) → Airtable Leads table
        │
        ▼
ElevenLabs generates voicemail audio → Vercel Blob (Pro/Enterprise only)
        │
        ▼
Make.com webhook triggered → starts drip sequence scheduler
        │
        ▼
Day 1: 20% of leads → SMS sent via Twilio
Day 2: 20% of leads → Voicemail drop via Twilio
Day 3: 20% of leads → Email via Resend
Day 4: 20% → repeat cycle (skip leads that replied)
Day 5: final 20%
        │
        ▼
Inbound replies → api/twilio-reply.ts → intent detection → Airtable status update
        │
        ▼
Contractor dashboard: Interested / Not Interested / Awaiting Reply
```

**Stack:**
- Frontend: React 18 + Vite + TypeScript + Tailwind CSS (v3) + React Router v6
- Backend: Vercel Serverless Functions (`/api/`)
- Auth: Firebase Auth (client + admin)
- Database: Airtable (Leads, Contractors, Campaigns, Events tables)
- Storage: Vercel Blob (voicemail audio files)
- Hosting: Vercel
- Automation: Make.com (drip sequencing, scheduling)
- SMS/Voice: Twilio (toll-free number, SMS, voicemail drops)
- TTS: ElevenLabs (voicemail audio generation)
- Email: Resend
- Payments: Stripe
- Forms: Tally.so
- Notifications: Telegram bot

---

## 2. CURRENT STATUS

| Feature | Status | Notes |
|---|---|---|
| Firebase Auth | ✅ LIVE | Email + password, email verification |
| CSV Upload | ✅ LIVE | Leads parsed and stored in Airtable |
| Drip Campaigns | ✅ LIVE | 20% daily batches configured |
| Reply Parsing | ✅ LIVE | Yes/No/Maybe intent detection active |
| Make.com Automation | ✅ CONFIGURED | Webhooks set up, scheduling active |
| ElevenLabs Voicemail | ✅ LIVE | Generates on signup for Pro/Enterprise |
| Airtable Events Table | ✅ LIVE | SMS/voicemail/email tracking active |
| Vercel Cron Jobs | ✅ LIVE | Morning/evening briefings + daily drip |
| Stripe Payments | ✅ LIVE | Test mode; live mode switch pending |
| SMS (Twilio) | ⏳ PENDING | Toll-free verification applied 2026-03-20 |
| Voicemail Drops (Twilio) | ⏳ PENDING | Awaiting same Twilio verification |
| Stripe Live Mode | ⏳ PENDING | Switch after Twilio verified |

**Live Data:**
- 1 active customer: Eric (LeafHome), Pro tier
- 446 leads loaded
- Drip sequences configured and running (SMS/voicemail will activate upon Twilio verification)

**Airtable Tables Active:**
- `Leads` — 446 records (Eric's LeafHome leads)
- `Contractors` — 1 record (Eric)
- `Campaigns` — tracking drip runs
- `Events` — SMS/email/voicemail send log

---

## 3. HOW IT WORKS

### 1. Contractor Signs Up
- Fills out form: name, email, password, company name, phone, TCPA checkbox
- Firebase Auth creates account → email verification sent
- `api/auth/signup.ts` verifies Firebase token → creates Airtable Contractors record
- Voicemail generation triggered automatically (Pro/Enterprise)

### 2. Selects a Plan
- Starter: $150/mo — 300 leads, SMS only
- Pro: $400/mo — 1000 leads, SMS + voicemail
- Enterprise: $800/mo — 3000 leads, SMS + email + voicemail + priority support
- Stripe handles billing

### 3. Uploads CSV
- Portal upload wizard accepts CSV with columns: Name, Phone, Email, Service, Company, etc.
- System parses, deduplicates, and stores leads in Airtable Leads table
- Make.com webhook triggered on upload to begin drip scheduling

### 4. Voicemail Generated (Pro/Enterprise)
- One-time generation per contractor account via ElevenLabs TTS
- Script: "Hi, this is [FirstName] [LastName] with [Company]. I'm following up on that project you reached out about. We'd love to earn your business — give me a call back when you get a chance. Thanks!"
- Contractor selects Male (Josh) or Female (Sarah) voice
- Audio stored in Vercel Blob at a public URL
- URL saved to Airtable Contractors.VoicemailUrl field
- Reused for every lead (no per-lead regeneration)
- Cost: ~$0.25 per generation (one-time)

### 5. Make.com Starts Scheduling
- Receives webhook from `api/campaigns/launch.ts`
- Splits leads into 20% daily batches (BatchNumber 1–5)
- Schedules sends for 9 AM – 7 PM CDT only (Mon–Fri)
- Day 1: SMS → Day 2: Voicemail Drop → Day 3: Email → repeat for remaining batches

### 6. Twilio Sends Messages
- SMS: Short, personalized message referencing the service type
- Voicemail: Plays pre-recorded ElevenLabs audio via Twilio programmable voice
- Each send logged to Airtable Events table with timestamp, channel, and status

### 7. Automated Drip Sequences
- 20% of leads contacted per day (BatchNumber 1 = Day 1, etc.)
- Scheduling enforced: 9 AM – 7 PM CDT only
- Leads that have replied (Interested or Not Interested) are excluded from further batches
- `api/cron/follow-up-sms.ts` runs at 9 AM CDT daily (14:00 UTC, Mon–Fri)
- Only Enterprise tier runs automated follow-up SMS; Pro/Starter use Make.com scheduling

### 8. Voicemail Generation (ElevenLabs)
- Triggered at signup or first campaign launch
- `api/generate-voicemail.ts` calls ElevenLabs API → streams audio → uploads to Vercel Blob
- Blob URL stored in Contractors record
- Twilio uses the public Blob URL to play audio during calls

### 9. Reply Parsing
- Inbound SMS hits `api/twilio-reply.ts`
- Intent detection parses message body:
  - **Interested**: "yes", "interested", "call me back", "when can you come", "let's do it", etc.
  - **Not Interested**: "no", "not interested", "remove me", "stop", "unsubscribe"
  - **Neutral/Awaiting**: anything else
- Airtable Leads.Status updated accordingly
- Make.com receives action signal to stop or continue follow-up for that lead
- Conversation logged to Airtable Events table

---

## 4. CUSTOMER WORKFLOW

```
1. Sign up at bidback.app/signup
2. Select tier: Starter / Pro / Enterprise
3. Enter Stripe payment info
4. Complete profile: name, company, phone
5. System generates voicemail (Pro/Enterprise) — ~30 seconds
6. Upload CSV of leads (Name, Phone, Email, Service, Company)
7. Review leads in PortalLeads page
8. Launch campaign via PortalCampaigns wizard
9. Make.com schedules 20% daily batches
10. Day 1–5: leads receive SMS / voicemail / email automatically
11. Contractor views replies in PortalReplies (Interested / Not Interested / Awaiting)
12. Contractor calls back Interested leads directly
13. On Day 4+, replied leads excluded from further outreach
14. Dashboard shows real-time KPIs: contacted, interested, reply rate
```

---

## 5. INTEGRATIONS

### Firebase Auth
- Client: `src/lib/firebase.ts` — Firebase JS SDK v10
- Server: `api/lib/firebase-admin.ts` — Firebase Admin JWT verification
- Flows: email + password signup, email verification, sign in, session persistence
- Legacy fallback: `bb-` prefixed access codes (PortalLayout)

### Airtable
- Client: `src/lib/airtable.ts`
- Base: single base with Leads, Contractors, Campaigns, Events tables
- Used for: lead storage, status tracking, campaign logging, event history

### Stripe
- Webhook handler: `api/stripe-webhook.ts`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Updates Contractors.Plan in Airtable on subscription changes
- Currently in test mode

### Twilio ⏳ PENDING VERIFICATION
- Toll-free number applied 2026-03-20 (verification in progress)
- SMS: outbound messages from toll-free number to leads
- Voice: outbound calls that play ElevenLabs voicemail audio
- Inbound: reply handling via `api/twilio-reply.ts`
- Webhook: `api/twilio-voice.ts` — TwiML response handler for voice calls
- Cost: ~$0.0075 per SMS, ~$0.15 per voicemail call

### ElevenLabs (Voicemail Generation)
- `api/generate-voicemail.ts` — generates TTS audio
- Default voices:
  - Male: Josh — `TxGEqnHWrfWFTfGW9XjX`
  - Female: Sarah — `EXAVITQu4vr4xnSDxMaL`
- Audio format: MP3, stored in Vercel Blob
- One-time generation per contractor account (~$0.25)
- Reused across all leads in all campaigns

### Vercel Blob
- Stores voicemail MP3 files with public access URLs
- URL format: `https://[blob-store].public.blob.vercel-storage.com/voicemail-[contractorId].mp3`
- URL saved to Airtable Contractors.VoicemailUrl

### Make.com
- Receives webhook from `api/campaigns/launch.ts` on CSV upload + campaign launch
- Splits leads into 20% batches (BatchNumber 1–5)
- Schedules sends: 9 AM – 7 PM CDT only
- Handles conditional logic: if lead status = Interested or Not Interested → skip
- Connects to Twilio for SMS and voicemail drops
- Connects to Resend for email sends

### Resend
- Email delivery for drip sequences (Enterprise tier + Day 3+ sends)
- Templates stored in Settings.tsx

### Tally.so
- Intake form webhook handler: `api/tally-webhook.ts`
- Used for early access / waitlist signups (pre-auth flow)

### Telegram
- Notification bot for cron job briefings
- 7:30 AM CDT: morning briefing (leads contacted overnight, interested count)
- 9 PM CDT: evening check-in (daily summary)

---

## 6. AIRTABLE SCHEMA

### Leads Table
| Field | Type | Notes |
|---|---|---|
| Name | Text | Full name from CSV |
| Phone | Phone | Lead phone number |
| Email | Email | Lead email address |
| Service | Text | e.g., "Roof Replacement" |
| Company | Text | Lead's company (if applicable) |
| Status | Single Select | `Awaiting Reply`, `Interested`, `Not Interested` |
| BatchNumber | Number | 1–5 (which 20% batch) |
| LastContactedAt | DateTime | Timestamp of most recent outreach |
| LastRepliedAt | DateTime | Timestamp of most recent inbound reply |
| FollowUpSent | Checkbox | Whether any follow-up was sent |
| FollowUpSentAt | DateTime | Timestamp of first follow-up |
| AccountId | Text | Links to Contractors.ContractorId |
| ContractorPlan | Single Select | `Starter`, `Pro`, `Enterprise` |
| CreatedAt | DateTime | Upload timestamp (used for Day 1–N calc) |

### Contractors Table
| Field | Type | Notes |
|---|---|---|
| FirebaseUid | Text | Firebase Auth UID |
| Email | Email | Contractor login email |
| FirstName | Text | |
| LastName | Text | |
| Name | Text | Full name (FirstName + LastName) |
| Company | Text | Business name |
| Phone | Phone | |
| Plan | Single Select | `Starter`, `Pro`, `Enterprise` |
| VoicemailUrl | URL | Vercel Blob public URL for MP3 |
| VoicemailGeneratedAt | DateTime | When voicemail was created |
| SignedUpAt | DateTime | Account creation timestamp |
| LeadsThisMonth | Number | Usage counter |
| SmsThisMonth | Number | Usage counter |
| EmailsThisMonth | Number | Usage counter |
| VoicemailsThisMonth | Number | Usage counter |
| UsageResetDate | DateTime | Monthly reset date |

### Campaigns Table
| Field | Type | Notes |
|---|---|---|
| CampaignId | Text | Unique ID |
| ContractorEmail | Email | Owner |
| ContractorName | Text | |
| LeadCount | Number | Total leads in campaign |
| Status | Single Select | `Scheduled`, `Running`, `Completed`, `Paused` |
| VoicemailUrl | URL | Voicemail used for this campaign |
| CreatedAt | DateTime | Launch timestamp |
| CompletedAt | DateTime | Completion timestamp |
| CallsConnected | Number | Twilio calls answered |
| CallsFailed | Number | Twilio calls failed/no answer |
| CallsTotal | Number | Total call attempts |

### Events Table
| Field | Type | Notes |
|---|---|---|
| EventId | Text | Unique ID |
| LeadId | Text | Links to Leads record |
| ContractorEmail | Email | |
| Channel | Single Select | `SMS`, `Voicemail`, `Email` |
| Direction | Single Select | `Outbound`, `Inbound` |
| Status | Single Select | `Sent`, `Delivered`, `Failed`, `Received` |
| Body | Long Text | Message content or transcript |
| BatchNumber | Number | Which batch (1–5) this event was part of |
| CreatedAt | DateTime | Event timestamp |
| TwilioSid | Text | Twilio message/call SID for lookup |

---

## 7. FRONTEND PAGES

### Public / Marketing
- `src/pages/Home.tsx` — Marketing landing page (pricing, features, CTA)
- `src/pages/Signup.tsx` — Full signup form: name, email, password, company, phone, TCPA
- `src/pages/SignIn.tsx` — Dual mode: Firebase email+password OR legacy bb- access code

### Portal (Contractor-Facing)
All portal pages live under `/portal/*` and are wrapped in `src/layouts/PortalLayout.tsx` (Firebase auth gate).

- **PortalDashboard** (`src/pages/portal/PortalDashboard.tsx`)
  - KPIs: total leads, contacted, interested, reply rate
  - Plan card with usage progress bar (leads used / limit)
  - Batch tracking: shows Day 1–5 progress
  - Health bar and event log (Airtable-wired)

- **PortalUpload** (`src/pages/portal/PortalUpload.tsx`)
  - CSV upload with column mapping
  - Preview parsed leads before confirming
  - Triggers Make.com webhook on submit

- **PortalLeads** (`src/pages/portal/PortalLeads.tsx`)
  - Full leads table with filters (status, batch, date range)
  - Bulk actions (mark interested, export)
  - Shows BatchNumber and LastContactedAt per lead

- **PortalCampaigns** (`src/pages/portal/PortalCampaigns.tsx`)
  - 3-step wizard: select leads → preview voicemail → confirm & launch
  - Campaign history table
  - Shows CallsConnected, CallsFailed, Status per campaign

- **PortalReplies** (reply management view)
  - Segmented tabs: Interested | Not Interested | Awaiting Reply
  - Shows lead name, phone, reply content, timestamp
  - Reply parsing result visualization (badge per intent)
  - Click-to-call or copy phone number actions

### Master Portal (Admin)
- `src/pages/MasterDashboard.tsx` — Cross-account KPIs, all contractors, all leads
- `src/pages/MasterLeads.tsx` — Global leads view with contractor filter

### Admin App (Internal)
- `src/pages/Dashboard.tsx` — KPIs, health bar, event log (Airtable-wired)
- `src/pages/Campaigns.tsx` — Leads table with filters + bulk actions
- `src/pages/Logs.tsx` — Activity event log with filters
- `src/pages/Integrations.tsx` — 9 integration cards + slide-over panels
- `src/pages/Settings.tsx` — Templates, timing, notifications, webhook tester
- `src/layouts/AdminLayout.tsx` — Sidebar nav + header

---

## 8. AUTHENTICATION

### Firebase Auth (Primary)
- `src/lib/firebase.ts` — Firebase JS SDK v10 initialization
- `api/lib/firebase-admin.ts` — Admin SDK for server-side JWT verification
- `api/auth/signup.ts` — POST `/api/auth/signup`
  - Accepts Firebase ID token in Authorization header
  - Verifies token → decodes UID + email
  - Creates Airtable Contractors record
  - Triggers voicemail generation (if Pro/Enterprise plan)
- `src/layouts/PortalLayout.tsx` — `onAuthStateChanged` listener, redirects unauthenticated users

### Legacy Access Codes (Fallback)
- `bb-` prefixed passwords stored in Airtable Contractors.AccessCode
- `src/pages/SignIn.tsx` detects `bb-` prefix and routes to legacy flow
- Maintained for backward compatibility with early test accounts

---

## 9. PRICING

### Tier Structure

| Plan | Price | Lead Limit | Channels | Support |
|---|---|---|---|---|
| Starter | $150/mo | 300 leads | SMS only | Standard |
| Pro | $400/mo | 1,000 leads | SMS + Voicemail | Standard |
| Enterprise | $800/mo | 3,000 leads | SMS + Voicemail + Email | Priority |

### Feature Breakdown

**Starter ($150/mo)**
- Up to 300 leads/month
- SMS drip sequences (5-day, 20% daily batches)
- Airtable dashboard: Interested / Not Interested / Awaiting Reply
- Reply detection and auto-stop on opt-out
- Basic reporting

**Pro ($400/mo)**
- Up to 1,000 leads/month
- SMS + pre-recorded voicemail drops
- ElevenLabs voicemail generation included (one-time)
- All Starter features
- Batch tracking and reply visualization

**Enterprise ($800/mo)**
- Up to 3,000 leads/month
- SMS + Voicemail + Email sequences
- Automated Vercel cron follow-up (in addition to Make.com)
- Priority support
- All Pro features

### Cost Justification

| Plan | Monthly Cost | Break-even | Avg Job Value |
|---|---|---|---|
| Starter | $150/mo | 1 job/month | $2,000–$10,000 |
| Pro | $400/mo | 1–2 jobs/month | $2,000–$10,000 |
| Enterprise | $800/mo | 1–2 jobs/month | $5,000–$50,000 |

### Cost Structure (Per Lead)
| Channel | Cost |
|---|---|
| SMS (outbound) | ~$0.0075/message |
| Voicemail drop | ~$0.15/call |
| Email (Resend) | Free (generous free tier) |
| Voicemail generation | ~$0.25 one-time per contractor |

### Gross Margins
- Starter: ~90%+ margin at full capacity
- Pro: ~85–95% margin depending on voicemail call volume
- Enterprise: ~29–97% margin depending on all-channel usage
- Average blended margin: ~70–85%

---

## 10. CRON JOBS

All cron jobs are configured in `vercel.json` and run as Vercel serverless functions.

### Schedule

| Cron | UTC Time | Local Time (CDT) | Days | Function |
|---|---|---|---|---|
| `0 12 * * 1-5` | 12:00 UTC | 7:00 AM CDT | Mon–Fri | Morning briefing |
| `0 2 * * 1-5` | 02:00 UTC | 9:00 PM CDT (prev day) | Mon–Fri | Evening check-in |
| `0 14 * * 1-5` | 14:00 UTC | 9:00 AM CDT | Mon–Fri | Daily drip execution |

> Note: CDT = UTC-5. Adjust for CST (UTC-6) in winter.

### Morning Briefing (7:30 AM CDT)
- Sends Telegram notification to admin
- Content: leads contacted yesterday, new interested count, daily summary
- File: `api/cron/morning-briefing.ts`

### Evening Check-in (9 PM CDT)
- Sends Telegram notification to admin
- Content: day's total activity, reply rate, any failed sends
- File: `api/cron/evening-checkin.ts`

### Daily Drip Execution (9 AM CDT)
- `api/cron/follow-up-sms.ts`
- Queries Airtable for leads where:
  - Status = `Awaiting Reply`
  - FollowUpSent = false OR LastContactedAt > 24 hours ago
  - ContractorPlan = `Enterprise`
- Sends follow-up SMS via Twilio
- Updates LastContactedAt and FollowUpSent in Airtable
- Logs event to Airtable Events table

### vercel.json Cron Config
```json
{
  "crons": [
    { "path": "/api/cron/morning-briefing", "schedule": "0 12 * * 1-5" },
    { "path": "/api/cron/evening-checkin", "schedule": "0 2 * * 1-5" },
    { "path": "/api/cron/follow-up-sms", "schedule": "0 14 * * 1-5" }
  ]
}
```

---

## 11. DRIP CAMPAIGN SYSTEM

### Batch Logic
- Total leads split into 5 equal batches (~20% each)
- BatchNumber 1 = Day 1, BatchNumber 2 = Day 2, etc.
- Each batch processed on its scheduled day
- Leads with Status = `Interested` or `Not Interested` skipped in subsequent batches

### Channel Sequence (Default)
```
Day 1: SMS (BatchNumber = 1)
Day 2: Voicemail Drop (BatchNumber = 2)  [Pro/Enterprise only]
Day 3: Email (BatchNumber = 3)           [Enterprise only]
Day 4: SMS follow-up (BatchNumber = 4)   [skips replied leads]
Day 5: Final SMS (BatchNumber = 5)       [skips replied leads]
```

### Scheduling Rules
- Send window: 9:00 AM – 7:00 PM CDT
- Days: Monday–Friday only
- Make.com enforces time-of-day gating before each send
- No sends on weekends or outside business hours

### Tier Limits
| Plan | Lead Limit | Channels |
|---|---|---|
| Starter | 300/mo | SMS only |
| Pro | 1,000/mo | SMS + Voicemail |
| Enterprise | 3,000/mo | SMS + Voicemail + Email |

### Airtable Events Tracking
Every send creates an Events record:
```
LeadId, ContractorEmail, Channel (SMS/Voicemail/Email),
Direction (Outbound), Status (Sent/Delivered/Failed),
BatchNumber, CreatedAt, TwilioSid
```

---

## 12. VOICEMAIL GENERATION

### Overview
- One-time per contractor account (not per lead)
- Generated at signup (Pro/Enterprise) or first campaign launch
- Stored permanently in Vercel Blob
- Reused for every voicemail drop across all campaigns

### Script Template
```
"Hi, this is [FirstName] [LastName] with [Company].
I'm following up on that project you reached out about.
We'd love to earn your business — give me a call back when you get a chance.
Thanks, and have a great day!"
```

### Voice Options
| Option | ElevenLabs Voice ID | Description |
|---|---|---|
| Male (Josh) | `TxGEqnHWrfWFTfGW9XjX` | Deep, professional male voice |
| Female (Sarah) | `EXAVITQu4vr4xnSDxMaL` | Warm, professional female voice |

### Technical Flow
```
api/generate-voicemail.ts
  → Build script from Contractors record
  → POST to ElevenLabs /v1/text-to-speech/{voice_id}
  → Stream MP3 response
  → Upload to Vercel Blob (public)
  → Save URL to Airtable Contractors.VoicemailUrl
```

### Cost
- ~$0.25 per generation (one-time per contractor)
- ~$0.15 per voicemail drop (Twilio call cost)

### Twilio Delivery
- `api/twilio-voice.ts` returns TwiML `<Play>` with Blob URL
- Twilio dials lead's phone → plays voicemail audio → hangs up
- Call result logged to Airtable Events table

---

## 13. REPLY PARSING

### Intent Detection Logic (`api/twilio-reply.ts`)

**Interested** (status → `Interested`):
- Keywords: "yes", "yeah", "yep", "sure", "interested", "call me", "call me back",
  "when can you come", "let's do it", "sounds good", "please call", "i'm in"

**Not Interested** (status → `Not Interested`):
- Keywords: "no", "nope", "not interested", "remove me", "stop", "unsubscribe",
  "don't contact", "do not contact", "leave me alone", "take me off"

**Neutral / Awaiting Reply** (status unchanged, logged):
- All other messages — logged but no status change

### Actions on Reply
```
Interested   → Update Leads.Status = "Interested"
             → Log to Airtable Events (Direction: Inbound)
             → Signal Make.com to stop further outreach for this lead
             → Telegram notification to admin (if first reply)

Not Interested → Update Leads.Status = "Not Interested"
              → Log to Airtable Events
              → Signal Make.com to permanently stop outreach
              → Send STOP acknowledgment SMS to lead

Neutral       → Log to Airtable Events
             → No status change
             → Continue drip sequence
```

### Make.com Integration
- `api/twilio-reply.ts` sends webhook to Make.com with:
  - `leadId`, `phone`, `intent`, `message`, `contractorEmail`
- Make.com uses intent to update scheduling filters

---

## 14. CODE LOCATIONS

### API (Vercel Serverless Functions)
| File | Route | Purpose |
|---|---|---|
| `api/auth/signup.ts` | POST `/api/auth/signup` | Firebase token verify → Airtable contractor create |
| `api/generate-voicemail.ts` | POST `/api/generate-voicemail` | ElevenLabs TTS → Vercel Blob |
| `api/campaigns/launch.ts` | POST `/api/campaigns/launch` | Create Campaign record + trigger Make.com |
| `api/campaign-results.ts` | POST `/api/campaign-results` | Make.com callback with Twilio results |
| `api/twilio-voice.ts` | POST `/api/twilio-voice` | TwiML handler for voicemail calls |
| `api/twilio-reply.ts` | POST `/api/twilio-reply` | Inbound SMS handler + intent detection |
| `api/contractor/usage.ts` | GET `/api/contractor/usage` | Plan limits + usage counts |
| `api/stripe-webhook.ts` | POST `/api/stripe-webhook` | Stripe event handler |
| `api/tally-webhook.ts` | POST `/api/tally-webhook` | Tally form intake |
| `api/cron/follow-up-sms.ts` | Cron (14:00 UTC M–F) | Daily drip SMS execution |
| `api/cron/morning-briefing.ts` | Cron (12:00 UTC M–F) | Telegram morning briefing |
| `api/cron/evening-checkin.ts` | Cron (02:00 UTC M–F) | Telegram evening check-in |
| `api/lib/firebase-admin.ts` | (library) | Firebase Admin SDK init |

### Frontend (src/)
| File | Route | Purpose |
|---|---|---|
| `src/main.tsx` | — | App entry point |
| `src/App.tsx` | — | Router config |
| `src/index.css` | — | Global styles + Tailwind |
| `src/lib/firebase.ts` | — | Firebase client SDK |
| `src/lib/airtable.ts` | — | Airtable API client |
| `src/lib/integrations.ts` | — | localStorage config store |
| `src/pages/Home.tsx` | `/` | Marketing landing page |
| `src/pages/Signup.tsx` | `/signup` | Contractor signup |
| `src/pages/SignIn.tsx` | `/signin` | Sign in (Firebase + legacy) |
| `src/pages/Dashboard.tsx` | `/dashboard` | Admin KPI dashboard |
| `src/pages/Campaigns.tsx` | `/campaigns` | Admin leads table |
| `src/pages/Logs.tsx` | `/logs` | Admin event log |
| `src/pages/Integrations.tsx` | `/integrations` | Integration cards + config |
| `src/pages/Settings.tsx` | `/settings` | Templates + webhook tester |
| `src/pages/portal/PortalDashboard.tsx` | `/portal` | Contractor KPIs + plan card |
| `src/pages/portal/PortalUpload.tsx` | `/portal/upload` | CSV upload wizard |
| `src/pages/portal/PortalLeads.tsx` | `/portal/leads` | Leads table + filters |
| `src/pages/portal/PortalCampaigns.tsx` | `/portal/campaigns` | Campaign wizard + history |
| `src/layouts/AdminLayout.tsx` | — | Admin sidebar nav + header |
| `src/layouts/PortalLayout.tsx` | — | Portal auth gate + nav |

### Config
| File | Purpose |
|---|---|
| `vercel.json` | Routing config + cron job schedules |
| `.env.example` | All required environment variables |
| `vite.config.ts` | Vite build config |
| `tailwind.config.js` | Tailwind design tokens |

---

## 15. ENVIRONMENT VARIABLES

All variables documented in `.env.example`. Required for full operation:

### Firebase
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
FIREBASE_ADMIN_PRIVATE_KEY
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PROJECT_ID
```

### Airtable
```
VITE_AIRTABLE_API_KEY
VITE_AIRTABLE_BASE_ID
AIRTABLE_API_KEY          (server-side)
AIRTABLE_BASE_ID          (server-side)
```

### Twilio
```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER       (toll-free, pending verification)
```

### ElevenLabs
```
ELEVENLABS_API_KEY
```

### Vercel Blob
```
BLOB_READ_WRITE_TOKEN
```

### Stripe
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
VITE_STRIPE_PUBLISHABLE_KEY
```

### Make.com
```
MAKE_WEBHOOK_URL          (drip campaign trigger)
MAKE_REPLY_WEBHOOK_URL    (reply intent routing)
```

### Resend
```
RESEND_API_KEY
RESEND_FROM_EMAIL
```

### Telegram
```
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

---

## 16. DEPLOYMENT

### Platform: Vercel
- Automatic deploys from main branch
- Serverless functions from `/api/` directory
- Environment variables set in Vercel project settings

### Build Command
```bash
npm run build
```
TypeScript strict mode — must pass clean before deploy.

### Vercel Configuration (`vercel.json`)
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "crons": [
    { "path": "/api/cron/morning-briefing", "schedule": "0 12 * * 1-5" },
    { "path": "/api/cron/evening-checkin", "schedule": "0 2 * * 1-5" },
    { "path": "/api/cron/follow-up-sms", "schedule": "0 14 * * 1-5" }
  ]
}
```

### Live Data (as of 2026-03-24)
- **Customer:** Eric (LeafHome), Pro tier
- **Leads:** 446 loaded and segmented into 5 batches
- **Drip status:** Configured and running; SMS/voicemail pending Twilio toll-free verification
- **Twilio verification:** Applied 2026-03-20, estimated 3–5 business days

### Pre-Launch Checklist
- [ ] Twilio toll-free number verified
- [ ] Switch Stripe to live mode
- [ ] Create Firebase project + set credentials in Vercel
- [ ] Provision Vercel Blob storage (`vercel storage add`)
- [ ] Create Airtable Contractors and Campaigns tables
- [ ] Set all Vercel env vars from .env.example
- [ ] Test end-to-end with real phone number

---

## 17. DESIGN SYSTEM

### Colors
| Token | Hex | Usage |
|---|---|---|
| Primary (Navy) | `#1A3D5C` | Buttons, headers, nav |
| Accent (Orange) | `#D97706` | Badges, CTAs, highlights |
| Body text | `#111827` | Primary text |
| Secondary text | `#6b7280` | Labels, subtitles |
| Background | `#F9FAFB` | Page background |
| Card background | `#FFFFFF` | Cards, panels |
| Border | `#E5E7EB` | Card borders, dividers |
| Success | `#10B981` | Interested badge |
| Error | `#EF4444` | Not Interested badge |
| Warning | `#F59E0B` | Awaiting Reply badge |

### Typography
- Font: system sans-serif stack
- Headings: font-semibold or font-bold
- Body: font-normal, text-sm or text-base

### Component Rules
- **Buttons:** Navy background, white text, `rounded` (4px max — no rounded-xl on buttons)
- **Cards:** White background, `border border-gray-200`, `rounded-lg`, `shadow-sm`
- **No gradients** anywhere in the UI
- **Corners:** max 4px radius (squared, professional feel)
- **Spacing:** generous padding (p-6 minimum on cards)
- **Badges:** colored background + colored text, rounded-full, text-xs

### Design Principles
- Professional, contractor-focused aesthetic
- No gimmicks, no gradients, no animations beyond subtle transitions
- Information density: show the data, minimize chrome
- Mobile-responsive but desktop-first
- Reusable across all BidBack products

---

## 18. NOTES

### Voicemail Notes
- Voicemail is generated once per contractor, not per lead or campaign
- If a contractor changes their company name, voicemail must be regenerated manually (no auto-regen)
- Vercel Blob URLs are permanent — no expiration
- ElevenLabs TTS latency is ~3–8 seconds for a 20-second clip
- Future: allow contractors to re-record via mic in portal (manual override)

### Reply Parsing Notes
- Intent detection is keyword-based (not ML) — fast and predictable
- False positive risk: "no problem" could trigger Not Interested — consider expanding exclusion list
- Opt-out ("stop", "unsubscribe") sends STOP acknowledgment SMS per TCPA compliance
- All inbound messages logged regardless of intent — full conversation history in Events table
- Future: sentiment analysis upgrade via Claude API for ambiguous replies

### Twilio Notes
- Toll-free verification is required for A2P SMS compliance
- Without verification, Twilio will block outbound SMS to US numbers
- Voicemail drops use Twilio Programmable Voice + TwiML `<Play>` verb
- Twilio call records automatically stored in Twilio console (30-day retention)

### Make.com Notes
- Make.com is the orchestration layer for scheduling — it enforces the 9 AM–7 PM CDT window
- Vercel cron (`follow-up-sms.ts`) is a secondary/backup execution layer for Enterprise tier
- Make.com scenarios should have error handling for Twilio rate limits
- Webhook URLs should be rotated if compromised (update in Vercel env vars + Make.com scenario)

### TCPA Compliance
- TCPA checkbox required at signup (logged in Contractors.SignedUpAt)
- Opt-out keywords trigger immediate stop + acknowledgment SMS
- No sends before 9 AM or after 7 PM recipient's local time
- Toll-free number provides cleaner compliance posture than shared short codes

### Pricing Notes
- All features bundled per tier — no a la carte add-ons
- Month-to-month billing (no annual lock-in at launch)
- Usage resets on the billing anniversary date (not calendar month)
- Overage policy: TBD (currently hard cap at tier limit)
