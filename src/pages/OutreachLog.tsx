import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/auth'
import { loadBook, deleteOutreach, type Book } from '../lib/db'
import { Card, Loading, ErrorNote, EmptyState, Badge, Button, PageHeader, DeleteButton, statusLabel } from '../components/ui'
import { OutreachModal } from '../components/modals'
import { shortDate } from '../lib/format'

export default function OutreachLog() {
  const { tenantId } = useAuth()
  const [book, setBook]       = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
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
    if (!q) return book?.outreach ?? []
    return (book?.outreach ?? []).filter(o =>
      (clientName[o.client_id] ?? '').toLowerCase().includes(q) || (o.notes ?? '').toLowerCase().includes(q),
    )
  }, [book, search, clientName])

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

      {/* One lever: search. */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by client or notes…"
        className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#c15a2e] focus:outline-none focus:ring-2 focus:ring-[#c15a2e]/20"
      />

      {(book?.outreach.length ?? 0) === 0 ? (
        <Card><EmptyState message="No outreach logged yet. Every check-in, pitch, and follow-up shows up here." action={<Button onClick={() => setShowLog(true)} disabled={clientOptions.length === 0}>Log your first touch</Button>} /></Card>
      ) : rows.length === 0 ? (
        <Card><EmptyState message="No outreach matches your search." /></Card>
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
