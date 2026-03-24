# BidBack — Lead Revival Platform

Automated SMS / Email / Voicemail follow-up system for contractors. Upload a CSV of lost bids and BidBack automatically contacts each lead over a 5-day drip sequence, detects replies, and surfaces interested leads in real time.

---

## Features

- **CSV lead import** — flexible column matching for any contractor's export format
- **Automated drip sequences** — 20% daily batches over 5 days
- **Multi-channel delivery** — SMS, pre-recorded voicemail drops, and email
- **Smart reply detection** — classifies inbound SMS as Interested / Not Interested / Awaiting Reply
- **Real-time dashboard** — KPIs, reply rates, batch progress
- **Stripe subscription billing** — Starter / Pro / Enterprise tiers
- **AI voicemail generation** — personalized voicemail created once per contractor (ElevenLabs TTS)
- **Usage tracking** — per-tier lead and send limits with monthly resets

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v3 |
| Backend | Vercel Serverless Functions (`/api/`) |
| Database | Airtable |
| Auth | JWT (custom) |
| Payments | Stripe |
| SMS / Voice | Twilio |
| TTS | ElevenLabs |
| File Storage | Vercel Blob |
| Email | Resend |
| Automation | Make.com |
| Notifications | Telegram bot |

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-org/bidback.git
cd bidback
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in all values. See [Environment Variables](#environment-variables) below.

### 4. Run locally

```bash
npm run dev
```

### 5. Run with Vercel CLI (recommended — includes serverless functions)

```bash
npm install -g vercel
vercel dev
```

---

## Environment Variables

See `.env.example` for the full list with descriptions. Required services:

| Service | Purpose | Where to get key |
|---|---|---|
| Airtable | Lead and contractor storage | airtable.com → Account → API |
| Stripe | Subscription billing | dashboard.stripe.com → Developers |
| Twilio | SMS + voicemail | console.twilio.com |
| ElevenLabs | Voicemail TTS generation | elevenlabs.io → Profile |
| Vercel Blob | Voicemail MP3 storage | vercel.com → Storage |
| Resend | Email delivery | resend.com |
| Make.com | Drip sequence orchestration | make.com → Webhooks |
| Telegram | Cron job notifications | BotFather → create bot |

---

## Airtable Setup

Create a base with these tables:

- **Leads** — Name, Phone, Email, Service, Company, Status, BatchNumber, AccountId, etc.
- **Contractors** — Email, FirstName, LastName, CompanyName, Plan, VoicemailUrl, etc.
- **Campaigns** — CampaignId, ContractorEmail, LeadCount, Status, CreatedAt, etc.
- **Events** — LeadId, Channel, Direction, Status, BatchNumber, CreatedAt, etc.

See `BIDBACK_DOCUMENTATION.md` for full field schemas.

---

## Deployment

Deploy to Vercel:

```bash
vercel --prod
```

Set all environment variables in the Vercel dashboard under **Settings → Environment Variables** before deploying.

Cron jobs are configured in `vercel.json` and run automatically on Vercel's infrastructure.

---

## Pricing Tiers

| Plan | Price | Lead Limit | Channels |
|---|---|---|---|
| Starter | $150/mo | 300 leads | SMS |
| Pro | $400/mo | 1,000 leads | SMS + Voicemail |
| Enterprise | $800/mo | 3,000 leads | SMS + Voicemail + Email |

---

## Project Structure

```
/
├── api/                    # Vercel serverless functions
│   ├── admin/              # One-time admin/migration scripts
│   ├── auth/               # Signup / signin
│   ├── cron/               # Scheduled jobs (drip, briefings)
│   ├── voicemail/          # ElevenLabs TTS generation
│   └── lib/                # Shared utilities
├── src/
│   ├── pages/
│   │   ├── portal/         # Contractor-facing portal
│   │   └── master/         # Admin master view
│   ├── layouts/            # AdminLayout, PortalLayout
│   └── lib/                # Airtable client, integrations
├── .env.example            # Environment variable template
├── vercel.json             # Routing + cron config
└── BIDBACK_DOCUMENTATION.md  # Full technical documentation
```

---

## License

Private — contact for licensing inquiries.
