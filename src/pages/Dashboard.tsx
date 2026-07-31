import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { loadBook, withStats, addOutreach, type Book } from '../lib/db'
import { Card, Loading, ErrorNote, Button, ContactFlag } from '../components/ui'
import { ClientModal, OutreachModal, PurchaseModal } from '../components/modals'
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
  const [showClient, setShowClient]     = useState(false)
  const [menuOpen, setMenuOpen]         = useState(false)

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

  // The 30-day rule: not contacted in 30+ days (or never) = needs a follow-up.
  const needsContact = useMemo(() => {
    return clients
      .map(c => ({ c, h: contactHealth(c.last_outreach_on) }))
      .filter(x => x.h.level !== 'green')
      .sort((a, b) => (b.h.days ?? 99999) - (a.h.days ?? 99999)) // never-contacted, then longest-overdue first
  }, [clients])
  const needCount = needsContact.length

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
        <div className="relative">
          <Button onClick={() => setMenuOpen(o => !o)}>+ Add</Button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <button onClick={() => { setMenuOpen(false); setShowClient(true) }}
                  className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50">Add client</button>
                <button onClick={() => { setMenuOpen(false); setShowOutreach(true) }} disabled={clients.length === 0}
                  className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Add outreach</button>
                <button onClick={() => { setMenuOpen(false); setShowPurchase(true) }} disabled={clients.length === 0}
                  className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Add purchase</button>
              </div>
            </>
          )}
        </div>
      </div>

      {error && <div className="mb-6"><ErrorNote message={error} /></div>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Clients" value={String(clients.length)} sub={`${clients.filter(c => c.status === 'vip').length} VIP`} />
        <Stat label="Needs follow-up" value={String(needCount)} sub="30+ days since contact" accent={needCount ? 'red' : 'emerald'} />
        <Stat label="Spend this month" value={money(monthSpend)} sub="this month" accent="blue" />
        <Stat label="Lifetime spend" value={money(totalSpend)} sub="all-time" accent="blue" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Needs contact */}
        <Card className="order-1 lg:order-none lg:col-span-2">
          <SectionHeader title="Needs follow-up" hint="Not contacted in 30+ days" to="/clients" />
          <div className="divide-y divide-slate-100">
            {needsContact.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">Everyone's been touched recently. Nice.</p>}
            {needsContact.slice(0, 7).map(({ c, h }) => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                <Link to="/clients" className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <ContactFlag level={h.level} />
                    <span className="truncate text-sm font-medium text-slate-800">{c.name}</span>
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
        <Card className="order-4 lg:order-none">
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

        {/* Spend chart */}
        <Card className="order-3 lg:order-none">
          <SectionHeader title="Spend · last 6 mo" />
          <div className="px-4 pb-4 pt-3">
            <SpendLineChart monthly={monthly} max={maxMonth} />
            <div className="mt-2 text-center text-xs text-slate-400">Peak {money(maxMonth)}</div>
          </div>
        </Card>

        {/* Top clients */}
        <Card className="order-2 lg:order-none">
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
        <Card className="order-5 lg:order-none">
          <SectionHeader title="Recent outreach" to="/outreach" />
          <div className="divide-y divide-slate-100">
            {recentOutreach.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">No outreach logged yet.</p>}
            {recentOutreach.map(o => (
              <div key={o.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="truncate text-sm font-medium text-slate-800">{clientName[o.client_id] ?? 'Unknown'}</span>
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(o.occurred_on)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {showClient && <ClientModal tenantId={tenantId!} defaultRep="Viscount" onClose={() => setShowClient(false)} onSaved={reload} />}
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

function SpendLineChart({ monthly, max }: { monthly: { key: string; total: number }[]; max: number }) {
  const W = 320, H = 132, padX = 16, padTop = 14, padBottom = 24
  const innerW = W - padX * 2, innerH = H - padTop - padBottom
  const n = monthly.length
  const xAt = (i: number) => padX + (n <= 1 ? innerW / 2 : (innerW * i) / (n - 1))
  const yAt = (v: number) => padTop + innerH - (max > 0 ? (v / max) * innerH : 0)
  const pts = monthly.map((m, i) => [xAt(i), yAt(m.total)] as const)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const base = padTop + innerH
  const area = `${line} L${xAt(n - 1).toFixed(1)},${base} L${xAt(0).toFixed(1)},${base} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 150 }} role="img" aria-label="Spend over the last 6 months">
      <line x1={padX} y1={base} x2={W - padX} y2={base} stroke="#e2e8f0" strokeWidth="1" />
      <path d={area} fill="#c15a2e" opacity="0.12" />
      <path d={line} fill="none" stroke="#c15a2e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={monthly[i].key}>
          <circle cx={p[0]} cy={p[1]} r="3" fill="#c15a2e"><title>{money(monthly[i].total)}</title></circle>
          <text x={p[0]} y={H - 7} textAnchor="middle" fontSize="10" fill="#94a3b8">{monthLabel(monthly[i].key + '-01')}</text>
        </g>
      ))}
    </svg>
  )
}
