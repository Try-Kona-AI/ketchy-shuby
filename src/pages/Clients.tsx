import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/auth'
import {
  loadBook, withStats, createClient, deleteClient, deleteOutreach, deletePurchase, addOutreach, type Book,
} from '../lib/db'
import {
  Card, Loading, ErrorNote, EmptyState, Badge, Button, PageHeader, DeleteButton, ContactFlag, statusLabel,
} from '../components/ui'
import { ClientModal, OutreachModal, PurchaseModal } from '../components/modals'
import { useToast } from '../hooks/useToast'
import { money, shortDate, timeAgo, todayISO, contactHealth, birthdayLabel, daysUntilBirthday } from '../lib/format'
import type { Client, ClientStats, ClientStatus } from '../lib/types'

type FilterKey = ClientStatus | 'all' | 'needs_contact'
const STATUS_FILTERS: { value: FilterKey; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'needs_contact', label: 'Needs contact' },
  { value: 'vip', label: 'VIP' },
  { value: 'active', label: 'Active' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'dormant', label: 'Dormant' },
]

export default function Clients() {
  const { tenantId } = useAuth()
  const { toast } = useToast()
  const [book, setBook]       = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<FilterKey>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [showAdd, setShowAdd]         = useState(false)
  const [editClient, setEditClient]   = useState<Client | null>(null)
  const [logFor, setLogFor]           = useState<string | null>(null)
  const [buyFor, setBuyFor]           = useState<string | null>(null)

  // quick-add
  const [qName, setQName]   = useState('')
  const [qPhone, setQPhone] = useState('')
  const [qBusy, setQBusy]   = useState(false)

  async function reload() {
    if (!tenantId) return
    try { setError(null); setBook(await loadBook(tenantId)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void reload() /* eslint-disable-next-line */ }, [tenantId])

  const clients = useMemo(() => (book ? withStats(book) : []), [book])
  const clientOptions = clients.map(c => ({ id: c.id, name: c.name }))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return clients.filter(c => {
      if (filter === 'needs_contact') {
        if (contactHealth(c.last_outreach_on).level === 'green') return false
      } else if (filter !== 'all' && c.status !== filter) return false
      if (!q) return true
      return [c.name, c.contact_name, c.company, c.rep, c.email, c.phone]
        .some(v => v?.toLowerCase().includes(q))
    })
  }, [clients, search, filter])

  const selected = selectedId ? clients.find(c => c.id === selectedId) ?? null : null

  async function quickAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!qName.trim()) { toast('Enter a name.', 'error'); return }
    setQBusy(true)
    try {
      await createClient({
        tenant_id: tenantId!, name: qName.trim(), phone: qPhone.trim() || null,
        contact_name: null, email: null, company: null, rep: 'Viscount',
        status: 'prospect', birthday: null, next_followup_date: null, notes: null,
      })
      setQName(''); setQPhone(''); toast('Contact added.')
      void reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not add.', 'error')
    } finally { setQBusy(false) }
  }

  async function logContactToday(c: ClientStats) {
    try {
      await addOutreach({
        tenant_id: tenantId!, client_id: c.id, occurred_on: todayISO(),
        type: 'check_in', channel: 'text', outcome: 'responded', notes: null,
      })
      toast(`Logged contact with ${c.name}.`)
      void reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not log.', 'error')
    }
  }

  async function removeClient(c: ClientStats) {
    if (!window.confirm(`Delete ${c.name}? This also removes their outreach and purchase history.`)) return
    await deleteClient(c.id)
    setSelectedId(null)
    void reload()
  }

  if (loading) return <Loading />

  const needsCount = clients.filter(c => contactHealth(c.last_outreach_on).level !== 'green').length

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} total · ${needsCount} need a touch · ${money(clients.reduce((s, c) => s + c.lifetime_spend, 0))} lifetime`}
        action={<Button variant="secondary" onClick={() => setShowAdd(true)}>Add with details</Button>}
      />

      {error && <div className="mb-6"><ErrorNote message={error} /></div>}

      {/* Quick add: name + phone, that's it */}
      <Card className="mb-4 p-3">
        <form onSubmit={quickAdd} className="flex flex-wrap items-center gap-2">
          <span className="px-1 text-xs font-medium uppercase tracking-wide text-slate-400">Quick add</span>
          <input
            value={qName} onChange={e => setQName(e.target.value)} placeholder="Name"
            className="min-w-[140px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <input
            value={qPhone} onChange={e => setQPhone(e.target.value)} placeholder="Phone" inputMode="tel"
            className="min-w-[140px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <Button type="submit" disabled={qBusy}>{qBusy ? 'Adding…' : 'Add'}</Button>
        </form>
      </Card>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.017-.034zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.value ? 'bg-[#0c2340] text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {f.label}{f.value === 'needs_contact' && needsCount ? ` (${needsCount})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {clients.length === 0 ? (
        <Card><EmptyState message="No clients yet. Use quick add above to drop in your first table buyer." /></Card>
      ) : filtered.length === 0 ? (
        <Card><EmptyState message="No clients match your search." /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[2fr_1.3fr_1fr_1fr_auto] gap-4 border-b border-slate-100 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-400 md:grid">
            <span>Client</span><span>Contact status</span><span>Lifetime</span><span>Birthday</span><span></span>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map(c => {
              const health = contactHealth(c.last_outreach_on)
              const bDays = daysUntilBirthday(c.birthday)
              return (
                <div key={c.id} className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3.5 hover:bg-slate-50 md:grid-cols-[2fr_1.3fr_1fr_1fr_auto]">
                  <button onClick={() => setSelectedId(c.id)} className="min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-800">{c.name}</span>
                      <Badge status={c.status} kind="client" />
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-400">
                      {c.phone || c.company || c.contact_name || '—'}{c.rep ? ` · ${c.rep}` : ''}
                    </div>
                  </button>
                  <button onClick={() => setSelectedId(c.id)} className="hidden text-left md:block">
                    <ContactFlag level={health.level} label={health.label} />
                  </button>
                  <button onClick={() => setSelectedId(c.id)} className="hidden text-left text-sm font-medium text-slate-700 md:block">
                    {money(c.lifetime_spend)}
                  </button>
                  <button onClick={() => setSelectedId(c.id)} className="hidden text-left text-sm md:block">
                    {c.birthday
                      ? <span className={bDays !== null && bDays <= 14 ? 'font-medium text-violet-600' : 'text-slate-500'}>{birthdayLabel(c.birthday)}{bDays !== null && bDays <= 14 ? ` · ${bDays}d` : ''}</span>
                      : <span className="text-slate-300">—</span>}
                  </button>
                  <Button size="xs" variant="secondary" onClick={() => logContactToday(c)}>Log contact</Button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {selected && (
        <ClientDrawer
          client={selected}
          book={book!}
          onClose={() => setSelectedId(null)}
          onEdit={() => setEditClient(selected)}
          onLog={() => setLogFor(selected.id)}
          onBuy={() => setBuyFor(selected.id)}
          onDelete={() => removeClient(selected)}
          onChanged={reload}
        />
      )}

      {showAdd && <ClientModal tenantId={tenantId!} defaultRep="Viscount" onClose={() => setShowAdd(false)} onSaved={reload} />}
      {editClient && <ClientModal tenantId={tenantId!} initial={editClient} onClose={() => setEditClient(null)} onSaved={reload} />}
      {logFor && <OutreachModal tenantId={tenantId!} clients={clientOptions} clientId={logFor} onClose={() => setLogFor(null)} onSaved={reload} />}
      {buyFor && <PurchaseModal tenantId={tenantId!} clients={clientOptions} clientId={buyFor} onClose={() => setBuyFor(null)} onSaved={reload} />}
    </div>
  )
}

// ── Slide-over detail ────────────────────────────────────────────────────────
function ClientDrawer({
  client, book, onClose, onEdit, onLog, onBuy, onDelete, onChanged,
}: {
  client: ClientStats
  book: Book
  onClose: () => void
  onEdit: () => void
  onLog: () => void
  onBuy: () => void
  onDelete: () => void
  onChanged: () => void
}) {
  const outreach  = book.outreach.filter(o => o.client_id === client.id)
  const purchases = book.purchases.filter(p => p.client_id === client.id)
  const health = contactHealth(client.last_outreach_on)
  const bDays = daysUntilBirthday(client.birthday)

  async function delOutreach(id: string) {
    if (!window.confirm('Delete this outreach entry?')) return
    await deleteOutreach(id); onChanged()
  }
  async function delPurchase(id: string) {
    if (!window.confirm('Delete this purchase?')) return
    await deletePurchase(id); onChanged()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="flex h-full w-full max-w-md flex-col bg-slate-50 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-6 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-bold text-slate-900">{client.name}</h2>
              <Badge status={client.status} kind="client" />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {[client.company, client.contact_name].filter(Boolean).join(' · ') || 'No company on file'}
              {client.rep ? ` · Rep: ${client.rep}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {client.phone && <span>{client.phone}</span>}
              {client.email && <span>{client.email}</span>}
              {client.birthday && <span>Birthday {birthdayLabel(client.birthday)}{bDays !== null && bDays <= 30 ? ` (${bDays}d)` : ''}</span>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z"/>
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-white px-6 py-3">
          <Button size="sm" onClick={onLog}>Log outreach</Button>
          <Button size="sm" variant="secondary" onClick={onBuy}>Record purchase</Button>
          <Button size="sm" variant="ghost" onClick={onEdit}>Edit</Button>
          <button onClick={onDelete} className="ml-auto rounded-lg px-2 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-50">Delete</button>
        </div>

        {/* Contact status banner */}
        <div className={`flex items-center justify-between px-6 py-3 text-sm ${
          health.level === 'red' ? 'bg-rose-50 text-rose-700' : health.level === 'yellow' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
        }`}>
          <span className="flex items-center gap-2"><ContactFlag level={health.level} /> {health.level === 'green' ? 'Contact is current' : health.level === 'yellow' ? 'Due for a touch soon' : 'Overdue for contact'}</span>
          <span className="text-xs opacity-80">{health.label}</span>
        </div>

        <div className="grid grid-cols-3 gap-px bg-slate-200 text-center">
          <div className="bg-white py-3"><div className="text-lg font-bold text-slate-900">{money(client.lifetime_spend)}</div><div className="text-[11px] text-slate-400">Lifetime</div></div>
          <div className="bg-white py-3"><div className="text-lg font-bold text-slate-900">{client.purchase_count}</div><div className="text-[11px] text-slate-400">Purchases</div></div>
          <div className="bg-white py-3"><div className="text-lg font-bold text-slate-900">{timeAgo(client.last_outreach_on)}</div><div className="text-[11px] text-slate-400">Last touch</div></div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {client.notes && (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</h3>
              <p className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{client.notes}</p>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Outreach ({outreach.length})</h3>
            {outreach.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-400">No outreach yet.</p>
            ) : (
              <div className="space-y-2">
                {outreach.map(o => (
                  <div key={o.id} className="group rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge status={o.type} kind="outreachType" />
                        <span className="text-xs text-slate-400">{shortDate(o.occurred_on)} · {statusLabel(o.channel)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {o.outcome && <Badge status={o.outcome} kind="outcome" />}
                        <div className="opacity-0 transition-opacity group-hover:opacity-100"><DeleteButton onClick={() => delOutreach(o.id)} /></div>
                      </div>
                    </div>
                    {o.notes && <p className="mt-1.5 text-sm text-slate-600">{o.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Purchases ({purchases.length})</h3>
            {purchases.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-400">No purchases recorded.</p>
            ) : (
              <div className="space-y-2">
                {purchases.map(p => (
                  <div key={p.id} className="group rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-800">{p.event_name || 'Table purchase'}</div>
                        <div className="text-xs text-slate-400">
                          {shortDate(p.purchased_on)}{p.table_name ? ` · ${p.table_name}` : ''}{p.party_size ? ` · party of ${p.party_size}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-slate-700">{money(p.amount)}</span>
                        <div className="opacity-0 transition-opacity group-hover:opacity-100"><DeleteButton onClick={() => delPurchase(p.id)} /></div>
                      </div>
                    </div>
                    {p.notes && <p className="mt-1.5 text-sm text-slate-600">{p.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
