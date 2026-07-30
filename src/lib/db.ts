import { supabase, DEMO } from './supabase'
import type { Client, ClientStats, Outreach, Purchase } from './types'
import {
  demoLoadBook, demoCreateClient, demoUpdateClient, demoDeleteClient,
  demoAddOutreach, demoDeleteOutreach, demoAddPurchase, demoDeletePurchase,
} from './demo'

// ── The "book" ─────────────────────────────────────────────────────────────
// A single client's book of business is small (dozens–hundreds of rows), so we
// pull clients + outreach + purchases in three queries and aggregate in memory.

export interface Book {
  clients: Client[]
  outreach: Outreach[]
  purchases: Purchase[]
}

export async function loadBook(tenantId: string): Promise<Book> {
  if (DEMO) return demoLoadBook()
  const [c, o, p] = await Promise.all([
    supabase.from('clients').select('*').eq('tenant_id', tenantId).order('name'),
    supabase.from('outreach').select('*').eq('tenant_id', tenantId).order('occurred_on', { ascending: false }),
    supabase.from('purchases').select('*').eq('tenant_id', tenantId).order('purchased_on', { ascending: false }),
  ])
  if (c.error) throw c.error
  if (o.error) throw o.error
  if (p.error) throw p.error
  return {
    clients: c.data ?? [],
    outreach: o.data ?? [],
    purchases: p.data ?? [],
  }
}

/** Merge aggregates onto each client. */
export function withStats(book: Book): ClientStats[] {
  return book.clients.map(c => {
    const purchases = book.purchases.filter(p => p.client_id === c.id)
    const outreach  = book.outreach.filter(o => o.client_id === c.id)
    const lifetime  = purchases.reduce((s, p) => s + Number(p.amount || 0), 0)
    const lastPurchase = purchases.map(p => p.purchased_on).sort().at(-1) ?? null
    const lastOutreach = outreach.map(o => o.occurred_on).sort().at(-1) ?? null
    return {
      ...c,
      lifetime_spend: lifetime,
      purchase_count: purchases.length,
      last_purchase_on: lastPurchase,
      last_outreach_on: lastOutreach,
      outreach_count: outreach.length,
    }
  })
}

// ── Clients ────────────────────────────────────────────────────────────────
export type ClientInput = Omit<Client, 'id' | 'created_at'>

export async function createClient(input: ClientInput): Promise<Client> {
  if (DEMO) return demoCreateClient(input)
  const { data, error } = await supabase.from('clients').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateClient(id: string, patch: Partial<ClientInput>): Promise<void> {
  if (DEMO) return demoUpdateClient(id, patch)
  const { error } = await supabase.from('clients').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteClient(id: string): Promise<void> {
  if (DEMO) return demoDeleteClient(id)
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}

// ── Outreach ───────────────────────────────────────────────────────────────
export type OutreachInput = Omit<Outreach, 'id' | 'created_at' | 'client'>

export async function addOutreach(input: OutreachInput, nextFollowup?: string | null): Promise<Outreach> {
  if (DEMO) return demoAddOutreach(input, nextFollowup)
  const { data, error } = await supabase.from('outreach').insert(input).select().single()
  if (error) throw error
  if (nextFollowup !== undefined) {
    await supabase.from('clients').update({ next_followup_date: nextFollowup }).eq('id', input.client_id)
  }
  return data
}

export async function deleteOutreach(id: string): Promise<void> {
  if (DEMO) return demoDeleteOutreach(id)
  const { error } = await supabase.from('outreach').delete().eq('id', id)
  if (error) throw error
}

// ── Purchases ──────────────────────────────────────────────────────────────
export type PurchaseInput = Omit<Purchase, 'id' | 'created_at' | 'client'>

export async function addPurchase(input: PurchaseInput): Promise<Purchase> {
  if (DEMO) return demoAddPurchase(input)
  const { data, error } = await supabase.from('purchases').insert(input).select().single()
  if (error) throw error
  await supabase.from('clients').update({ status: 'active' }).eq('id', input.client_id).eq('status', 'prospect')
  return data
}

export async function deletePurchase(id: string): Promise<void> {
  if (DEMO) return demoDeletePurchase(id)
  const { error } = await supabase.from('purchases').delete().eq('id', id)
  if (error) throw error
}
