import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { loadBook, withStats, addOutreach, type Book } from '../lib/db'
import { Card, Loading, ErrorNote, Badge, Button, ContactFlag } from '../components/ui'
import { OutreachModal, PurchaseModal } from '../components/modals'
import { useToast } from '../hooks/useToast'
import { money, timeAgo, todayISO, greeting, monthLabel, contactHealth, birthdayLabel, daysUntilBirthday } from '../lib/format'
import type { ClientStats } from '../lib/types'

export default function Dashboard() {
  const { tenantId, tenantName } = useAuth()
  const { toast } = useToast()
  const [book, setBook]       = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [showOutreach, setShowOutreach] = useState(false)
  const [showPurchase, setShowPurchase] = useState(false)

  async function reload() {
    if (!tenantId) return
    try { setError(null); setBook(await loadBook(tenantId)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load data.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void reload() /* eslint-disable-next-line */ }, [tenantId])

  const clients = useMemo(() => (book ? withStats(book) : []), [book])
  const clientName = useMemo(() => Object.fromEntries(clients.map(c => [c.id, c.name])), [clients])
  const today = todayISO()

  // Contact cadence: who needs a touch (red first, then yellow), worst overdue on top
  const needsContact = useMemo(() => {
    return clients
      .map(c => ({ c, h: contactHealth(c.last_outreach_on) }))
      .filter(x => x.h.level !== 'green')
      .sort((a, b) => {
        if (a.h.level !== b.h.level) return a.h.level === 'red' ? -1 : 1
        return (b.h.days ?? 9999) - (a.h.days ?? 9999)
      })
  }, [clients])
  const redCount = needsContact.filter(x => x.h.level === 'red').length
  const yellowCount = needsContact.filter(x => x.h.level === 'yellow').length

  // Upcoming birthdays (next 30 days)
  const birthdays = useMemo(() => {
    return clients
      .map(c => ({ c, d: daysUntilBirthday(c.birthday) }))
      .filter(x => x.d !== null && (x.d as number) <= 30)
      .sort((a, b) => (a.d as number) - (b.d as number))
  }, [clients])

  const totalSpend = book ? book.purchases.reduce((s, p) => s + Number(p.amount || 0), 0) : 0
  const monthSpend = book ? book.purchases.filter(p => p.purchased_on.slice(0, 7) === today.slice(0, 7)).reduce((s, p) => s + Number(p.amount || 0), 0) : 0
  const topClients = [...clients].sort((a, b) => b.lifetime_spend - a.lifetime_spend).slice(0, 5)
  const recentOutreach = book ? book.outreach.slice(0, 6) : []

  const monthly = useMemo(() => {
    const buckets: { key: string; total: number }[] = []
    const base = new Date(today + 'T00:00:00')
    for (let i = 5; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1)
      buckets.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, total: 0 })
    }
    book?.purchases.forEach(p => {
      const b = buckets.find(x => x.key === p.purchased_on.slice(0, 7))
      if (b) b.total += Number(p.amount || 0)
    })
    return buckets
  }, [book, today])
  const maxMonth = Math.max(1, ...monthly.map(m => m.total))

  async function quickLog(c: ClientStats) {
    try {
      await addOutreach({ tenant_id: tenantId!, client_id: c.id, occurred_on: today, type: 'check_in', channel: 'text', outcome: 'responded', notes: null })
      toast(`Logged contact with ${c.name}.`)
      void reload()
    } catch (err) { toast(err instanceof Error ? err.message : 'Could not log.', 'error') }
  }

  if (loading) return <Loading />
  const clientOptions = clients.map(c => ({ id: c.id, name: c.name }))

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[#2f3a24]">{greeting()}</h1>
          <p className="mt-1 text-sm text-slate-500">Here's where {tenantName || 'your book'} stands today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowPurchase(true)} disabled={clients.length === 0}>Record purchase</Button>
          <Button onClick={() => setShowOutreach(true)} disabled={clients.length === 0}>Log outreach</Button>
        </div>
      </div>

      {error && <div className="mb-6"><ErrorNote message={error} /></div>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Clients" value={String(clients.length)} sub={`${clients.filter(c => c.status === 'vip').length} VIP`} />
        <Stat label="Overdue" value={String(redCount)} sub="4+ weeks, contact now" accent={redCount ? 'red' : 'emerald'} />
        <Stat label="Due soon" value={String(yellowCount)} sub="3 weeks out" accent={yellowCount ? 'amber' : 'emerald'} />
        <Stat label="Spend this month" value={money(monthSpend)} sub={`${money(totalSpend)} all-time`} accent="blue" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Needs contact */}
        <Card className="lg:col-span-2">
          <SectionHeader title="Needs contact" hint="Monthly minimum · yellow at 3 wks, red at 4" to="/clients" />
          <div className="divide-y divide-slate-100">
            {needsContact.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">Everyone's been touched recently. Nice.</p>}
            {needsContact.slice(0, 7).map(({ c, h }) => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                <Link to="/clients" className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <ContactFlag level={h.level} />
                    <span className="truncate text-sm font-medium text-slate-800">{c.name}</span>
                    <Badge status={c.status} kind="client" />
                  </div>
                  <div className="mt-0.5 pl-4 text-xs text-slate-400">{c.phone ? `${c.phone} · ` : ''}{money(c.lifetime_spend)} lifetime</div>
                </Link>
                <span className={`shrink-0 text-xs font-medium ${h.level === 'red' ? 'text-rose-600' : 'text-amber-600'}`}>{h.label}</span>
                <Button size="xs" variant="secondary" onClick={() => quickLog(c)}>Log contact</Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Birthdays */}
        <Card>
          <SectionHeader title="Upcoming birthdays" hint="Next 30 days" />
          <div className="divide-y divide-slate-100">
            {birthdays.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">None in the next 30 days.</p>}
            {birthdays.map(({ c, d }) => (
              <Link to="/clients" key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                <span className="truncate text-sm font-medium text-slate-800">{c.name}</span>
                <span className="shrink-0 text-xs font-medium text-violet-600">{birthdayLabel(c.birthday)}{d === 0 ? ' · today' : ` · ${d}d`}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Spend chart */}
        <Card>
          <SectionHeader title="Spend · last 6 mo" />
          <div className="px-5 pb-5 pt-2">
            <div className="flex h-32 items-end gap-2">
              {monthly.map(m => (
                <div key={m.key} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-1 items-end">
                    <div className="w-full rounded-t-md bg-[#c15a2e]" style={{ height: `${Math.max(2, (m.total / maxMonth) * 100)}%` }} title={money(m.total)} />
                  </div>
                  <span className="text-[10px] text-slate-400">{monthLabel(m.key + '-01')}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-center text-xs text-slate-400">Peak {money(maxMonth)}</div>
          </div>
        </Card>

        {/* Top clients */}
        <Card>
          <SectionHeader title="Top clients by spend" to="/clients" />
          <div className="divide-y divide-slate-100">
            {topClients.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">No clients yet.</p>}
            {topClients.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-4 text-xs font-semibold text-slate-300">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-800">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.purchase_count} purchase{c.purchase_count === 1 ? '' : 's'}</div>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-slate-700">{money(c.lifetime_spend)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent outreach */}
        <Card>
          <SectionHeader title="Recent outreach" to="/outreach" />
          <div className="divide-y divide-slate-100">
            {recentOutreach.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">No outreach logged yet.</p>}
            {recentOutreach.map(o => (
              <div key={o.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-800">{clientName[o.client_id] ?? 'Unknown'}</span>
                    <Badge status={o.type} kind="outreachType" />
                  </div>
                  {o.notes && <div className="mt-0.5 truncate text-xs text-slate-400">{o.notes}</div>}
                </div>
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(o.occurred_on)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {showOutreach && <OutreachModal tenantId={tenantId!} clients={clientOptions} onClose={() => setShowOutreach(false)} onSaved={reload} />}
      {showPurchase && <PurchaseModal tenantId={tenantId!} clients={clientOptions} onClose={() => setShowPurchase(false)} onSaved={reload} />}
    </div>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: 'amber' | 'emerald' | 'blue' | 'red' }) {
  const accentCls = accent === 'amber' ? 'text-amber-600' : accent === 'emerald' ? 'text-emerald-600' : accent === 'blue' ? 'text-[#c15a2e]' : accent === 'red' ? 'text-rose-600' : 'text-slate-900'
  return (
    <Card className="p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1.5 text-2xl font-bold tracking-tight ${accentCls}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </Card>
  )
}

function SectionHeader({ title, hint, to }: { title: string; hint?: string; to?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
      {to && <Link to={to} className="text-xs font-medium text-[#c15a2e] hover:text-[#a54a24]">View all →</Link>}
    </div>
  )
}
