// Tier config — single source of truth for plan limits and feature flags
export type Tier = 'Free' | 'Starter' | 'Pro' | 'Enterprise'

export interface TierConfig {
  leads: number
  sms: boolean
  voicemail: boolean
  email: boolean
  price: string
  label: string
}

export const TIERS: Record<Tier, TierConfig> = {
  Free:       { leads: 0,    sms: false, voicemail: false, email: false, price: 'Free',     label: 'Free'       },
  Starter:    { leads: 300,  sms: true,  voicemail: false, email: false, price: '$150/mo',  label: 'Starter'    },
  Pro:        { leads: 1000, sms: true,  voicemail: true,  email: false, price: '$400/mo',  label: 'Pro'        },
  Enterprise: { leads: 3000, sms: true,  voicemail: true,  email: true,  price: '$800/mo',  label: 'Enterprise' },
}

export function getTier(plan: string | undefined): Tier {
  if (plan && plan in TIERS) return plan as Tier
  return 'Free'
}

export function isPaid(tier: Tier): boolean {
  return tier !== 'Free'
}
