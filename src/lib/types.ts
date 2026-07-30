// ── Domain: table-sales CRM ───────────────────────────────────────────────────
// A "client" is someone who buys (or might buy) tables. Outreach logs every touch;
// purchases record historical spend.

export type ClientStatus    = 'prospect' | 'active' | 'vip' | 'dormant'
export type OutreachType     = 'check_in' | 'pitch' | 'follow_up' | 'other'
export type OutreachChannel  = 'call' | 'text' | 'email' | 'dm' | 'in_person' | 'other'
export type OutreachOutcome  = 'no_response' | 'responded' | 'interested' | 'not_now' | 'closed_won' | 'closed_lost'

export interface Client {
  id: string
  tenant_id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  company: string | null
  rep: string | null
  status: ClientStatus
  birthday: string | null
  next_followup_date: string | null
  notes: string | null
  created_at: string
}

export interface Outreach {
  id: string
  tenant_id: string
  client_id: string
  occurred_on: string
  type: OutreachType
  channel: OutreachChannel
  outcome: OutreachOutcome | null
  notes: string | null
  created_at: string
  client?: Pick<Client, 'id' | 'name'>
}

export interface Purchase {
  id: string
  tenant_id: string
  client_id: string
  event_name: string | null
  purchased_on: string
  table_name: string | null
  party_size: number | null
  amount: number
  notes: string | null
  created_at: string
  client?: Pick<Client, 'id' | 'name'>
}

/** Client enriched with aggregates computed from purchases + outreach. */
export interface ClientStats extends Client {
  lifetime_spend: number
  purchase_count: number
  last_purchase_on: string | null
  last_outreach_on: string | null
  outreach_count: number
}

export interface Tenant {
  id: string
  name: string
  owner_user_id: string
  created_at: string
}
