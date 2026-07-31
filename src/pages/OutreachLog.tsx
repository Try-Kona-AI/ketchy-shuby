import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/auth'
import { loadBook, deleteOutreach, type Book } from '../lib/db'
import { Card, Loading, ErrorNote, EmptyState, Badge, Button, PageHeader, DeleteButton, statusLabel } from '../components/ui'
import { OutreachModal } from '../components/modals'
import { shortDate } from '../lib/format'
import type { OutreachType } from '../lib/types'

const TYPE_FILTERS: { value: OutreachType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'check_in', label: 'Check-ins' },
  { value: 'pitch', label: 'Pitches' },
  { value: 'follow_up', label: 'Follow-ups' },
  { value: 'other', label: 'Notes' },
]

export default function OutreachLog() {
  const { tenantId } = useAuth()
  const [book, setBook]       = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [filter, setFilter]   = useState<OutreachType | 'all'>('all')
  const [search, setSearch]   = useState('')
  const [showLog, setShowLog] = useState(false)

  async function reload() {
    if (!tenantId) return
    try { setError(null); setBook(await loadBook(tenantId)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void reload() /* eslint-disable-next-line */ }, [tenantId])

  const clientName = useMemo(
    () => Object.fromEntries((book?.clients ?? []).map(c => [c.id, c.name])),
    [book],
  )
  const clientOptions = (book?.clients ?? []).map(c => ({ id: c.id, name: c.name }))

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (book?.outreach ?? []).filter(o => {
      if (filter !== 'all' && o.type !== filter) return false
      if (!q) return true
      return (clientName[o.client_id] ?? '').toLowerCase().includes(q) || (o.notes ?? '').toLowerCase().includes(q)
    })
  }, [book, filter, search, clientName])

  async function del(id: string) {
    if (!window.confirm('Delete this outreach entry?')) return
    await deleteOutreach(id); void reload()
  }

  if (loading) return <Loading />

  return (
    <div>
      <PageHeader
        title="Outreach"
        subtitle={`${book?.outreach.length ?? 0} touches logged`}
        action={<Button onClick={() => setShowLog(true)} disabled={clientOptions.length === 0}>Log outreach</Button>}
      />

      {error && <div className="mb-6"><ErrorNote message={error} /></div>}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by client or notes…"
          className="flex-1 min-w-[200px] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.value ? 'bg-[#2f3a24] text-[#ece5d3]' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {(book?.outreach.length ?? 0) === 0 ? (
        <Card><EmptyState message="No outreach logged yet. Every check-in, pitch, and follow-up shows up here." action={<Button onClick={() => setShowLog(true)} disabled={clientOptions.length === 0}>Log your first touch</Button>} /></Card>
      ) : rows.length === 0 ? (
        <Card><EmptyState message="Nothing matches your filters." /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-slate-100">
            {rows.map(o => (
              <div key={o.id} className="group flex items-start justify-between gap-4 px-5 py-3.5 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{clientName[o.client_id] ?? 'Unknown'}</span>
                    <Badge status={o.type} kind="outreachType" />
                    {o.outcome && <Badge status={o.outcome} kind="outcome" />}
                    <span className="text-xs text-slate-400">{statusLabel(o.channel)}</span>
                  </div>
                  {o.notes && <p className="mt-1 text-sm text-slate-600">{o.notes}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-slate-400">{shortDate(o.occurred_on)}</span>
                  <div className="opacity-0 transition-opacity group-hover:opacity-100"><DeleteButton onClick={() => del(o.id)} /></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {showLog && <OutreachModal tenantId={tenantId!} clients={clientOptions} onClose={() => setShowLog(false)} onSaved={reload} />}
    </div>
  )
}
