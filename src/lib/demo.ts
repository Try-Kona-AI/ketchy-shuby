import type { Book } from './db'
import type { Client, Outreach, Purchase } from './types'

// ── Local demo store ─────────────────────────────────────────────────────────
// Fully in-browser fake data (localStorage-backed) so the app is clickable with
// zero backend. Mirrors the db.ts API. Replaced automatically by Supabase once
// the Kona project is wired up (see DEMO in supabase.ts).

const KEY = 'ks_demo_v2'
export const DEMO_TENANT = 'demo-tenant'

function uid(): string {
  return (crypto as Crypto).randomUUID()
}
function isoDaysAgo(n: number): string {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - n)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}
function birthdayInDays(n: number): string {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n)
  // year is cosmetic for birthdays; use a believable birth year
  return `1990-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function client(p: Partial<Client> & Pick<Client, 'name'>): Client {
  return {
    id: uid(), tenant_id: DEMO_TENANT,
    name: p.name, contact_name: p.contact_name ?? null, phone: p.phone ?? null,
    email: p.email ?? null, company: p.company ?? null, rep: p.rep ?? 'Viscount',
    status: p.status ?? 'prospect', birthday: p.birthday ?? null,
    next_followup_date: p.next_followup_date ?? null, notes: p.notes ?? null,
    created_at: new Date().toISOString(),
  }
}

function seed(): Book {
  const c = {
    marcus: client({ name: 'Marcus Bell', contact_name: 'Marcus', phone: '(609) 555-0142', email: 'marcus@bellgroup.co', company: 'Bell Group', status: 'vip', birthday: birthdayInDays(9), notes: 'Biggest spender. Always wants the corner booth. Birthday coming up — wants something big.' }),
    gabby:  client({ name: 'Gabby Moreno', contact_name: 'Gabby', phone: '(646) 555-0199', company: 'Moreno Nights', status: 'vip', birthday: birthdayInDays(120), notes: 'Runs a big friend group, splits bottles.' }),
    kessler:client({ name: 'The Kessler Bros', contact_name: 'Danny', phone: '(609) 555-0177', status: 'vip', birthday: birthdayInDays(200), notes: 'Two brothers, in almost every other weekend in season.' }),
    priya:  client({ name: 'Priya Shah', contact_name: 'Priya', phone: '(201) 555-0110', email: 'priya@shahco.com', company: 'Shah & Co', status: 'active', birthday: birthdayInDays(60), notes: 'Corporate entertaining, quarterly but big.' }),
    tyler:  client({ name: 'Delta Chi (Tyler)', contact_name: 'Tyler R.', phone: '(609) 555-0188', company: 'Delta Chi', status: 'active', birthday: birthdayInDays(3), notes: 'Frat formals + game nights, books for 10-12.' }),
    tony:   client({ name: 'Tony V', contact_name: 'Tony', phone: '(732) 555-0166', status: 'active', birthday: birthdayInDays(300), notes: 'Bachelor parties, always asks for a deal.' }),
    sasha:  client({ name: 'Sasha Lin', contact_name: 'Sasha', phone: '(646) 555-0133', email: 'sasha.lin@email.com', company: 'Lin Events', status: 'dormant', birthday: birthdayInDays(5), notes: 'Big last summer, quiet this year. Re-engage.' }),
    jordan: client({ name: 'Jordan Ruiz', contact_name: 'Jordan', phone: '(732) 555-0155', status: 'prospect', birthday: null, notes: 'Referred by Marcus. Not booked yet — keep warm.' }),
  }

  const O = (cl: Client, days: number, type: Outreach['type'], channel: Outreach['channel'], outcome: Outreach['outcome'], notes: string): Outreach => ({
    id: uid(), tenant_id: DEMO_TENANT, client_id: cl.id, occurred_on: isoDaysAgo(days),
    type, channel, outcome, notes, created_at: new Date().toISOString(),
  })
  const P = (cl: Client, days: number, event_name: string, table_name: string, party_size: number, amount: number, notes: string | null = null): Purchase => ({
    id: uid(), tenant_id: DEMO_TENANT, client_id: cl.id, event_name, purchased_on: isoDaysAgo(days),
    table_name, party_size, amount, notes, created_at: new Date().toISOString(),
  })

  const outreach: Outreach[] = [
    // last-contact recency drives the flag: green <21d, yellow 21-27d, red 28d+/never
    O(c.marcus, 6,  'pitch', 'text', 'interested', 'Pitched corner booth for his birthday. Sending bottle options.'),
    O(c.marcus, 20, 'check_in', 'call', 'responded', 'Summer plans check-in.'),
    O(c.gabby, 2,  'check_in', 'text', 'responded', 'Confirmed she is in this Saturday.'),
    O(c.tyler, 4,  'follow_up', 'text', 'responded', 'Head count for next game night.'),
    O(c.kessler, 23, 'check_in', 'text', 'responded', 'Quick touch, all good.'),         // yellow
    O(c.tony, 25, 'pitch', 'call', 'not_now', 'Floated a bachelor package.'),             // yellow
    O(c.priya, 31, 'check_in', 'email', 'no_response', 'Q3 corporate night email.'),      // red
    O(c.sasha, 44, 'follow_up', 'email', 'no_response', 'Re-engagement email, no reply.'), // red
    // Jordan: never contacted -> red
  ]

  const purchases: Purchase[] = [
    P(c.marcus, 14,  'Sat night', 'VIP Booth 1', 8,  4200, '3 bottles'),
    P(c.marcus, 35,  'Sat night', 'VIP Booth 1', 10, 5100),
    P(c.marcus, 210, 'NYE',       'VIP Booth 1', 12, 8000, 'Top night of the year'),
    P(c.gabby, 9,    'Sat night', 'Booth 2',     10, 3600),
    P(c.gabby, 40,   'Sat night', 'Booth 2',     8,  3100),
    P(c.kessler, 12, 'Sat night', 'Booth 3',     6,  1900),
    P(c.kessler, 26, 'Sat night', 'Booth 3',     6,  2050),
    P(c.priya, 46,   'Client dinner', 'Mezz 2',  6,  3400, 'Corporate card'),
    P(c.tyler, 18,   'Formal',    'Floor A',     12, 2600),
    P(c.tony, 60,    'Bachelor',  'Floor B',     14, 2900),
    P(c.sasha, 330,  'Launch party', 'Floor A',  14, 4600, 'Last summer'),
  ]

  return { clients: Object.values(c), outreach, purchases }
}

function load(): Book {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Book
  } catch { /* ignore */ }
  const fresh = seed()
  save(fresh)
  return fresh
}
function save(b: Book) {
  try { localStorage.setItem(KEY, JSON.stringify(b)) } catch { /* ignore */ }
}

export function demoResetSeed() { save(seed()) }

export async function demoLoadBook(): Promise<Book> {
  const b = load()
  // keep sorted like the real queries
  b.clients.sort((a, z) => a.name.localeCompare(z.name))
  b.outreach.sort((a, z) => (a.occurred_on < z.occurred_on ? 1 : -1))
  b.purchases.sort((a, z) => (a.purchased_on < z.purchased_on ? 1 : -1))
  return b
}

export async function demoCreateClient(input: Omit<Client, 'id' | 'created_at'>): Promise<Client> {
  const b = load()
  const c: Client = { ...input, id: uid(), created_at: new Date().toISOString() }
  b.clients.push(c); save(b); return c
}
export async function demoUpdateClient(id: string, patch: Partial<Client>) {
  const b = load()
  b.clients = b.clients.map(c => (c.id === id ? { ...c, ...patch } : c)); save(b)
}
export async function demoDeleteClient(id: string) {
  const b = load()
  b.clients = b.clients.filter(c => c.id !== id)
  b.outreach = b.outreach.filter(o => o.client_id !== id)
  b.purchases = b.purchases.filter(p => p.client_id !== id)
  save(b)
}
export async function demoAddOutreach(input: Omit<Outreach, 'id' | 'created_at' | 'client'>, nextFollowup?: string | null): Promise<Outreach> {
  const b = load()
  const o: Outreach = { ...input, id: uid(), created_at: new Date().toISOString() }
  b.outreach.push(o)
  if (nextFollowup !== undefined) b.clients = b.clients.map(c => (c.id === input.client_id ? { ...c, next_followup_date: nextFollowup } : c))
  save(b); return o
}
export async function demoDeleteOutreach(id: string) {
  const b = load(); b.outreach = b.outreach.filter(o => o.id !== id); save(b)
}
export async function demoAddPurchase(input: Omit<Purchase, 'id' | 'created_at' | 'client'>): Promise<Purchase> {
  const b = load()
  const p: Purchase = { ...input, id: uid(), created_at: new Date().toISOString() }
  b.purchases.push(p)
  b.clients = b.clients.map(c => (c.id === input.client_id && c.status === 'prospect' ? { ...c, status: 'active' } : c))
  save(b); return p
}
export async function demoDeletePurchase(id: string) {
  const b = load(); b.purchases = b.purchases.filter(p => p.id !== id); save(b)
}
