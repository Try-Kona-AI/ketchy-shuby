import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/auth'
import { loadBook, withStats, addOutreach, type Book } from '../lib/db'
import { Card, Loading, ErrorNote, EmptyState, Button, PageHeader, ContactFlag } from '../components/ui'
import { OutreachModal } from '../components/modals'
import { useToast } from '../hooks/useToast'
import { contactHealth, todayISO } from '../lib/format'
import type { ClientStats } from '../lib/types'

export default function OutreachLog() {
  const { tenantId } = useAuth()
  const { toast } = useToast()
  const [book, setBook]       = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [showLog, setShowLog] = useState(false)

  async function reload() {
    if (!tenantId) return
    try { setError(null); setBook(await loadBook(tenantId)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void reload() /* eslint-disable-next-line */ }, [tenantId])

  const clients = useMemo(() => (book ? withStats(book) : []), [book])
  const clientOptions = clients.map(c => ({ id: c.id, name: c.name }))

  const graded = useMemo(() => clients.map(c => ({ c, h: contactHealth(c.last_outreach_on) })), [clients])
  const needs = graded.filter(x => x.h.level !== 'green').sort((a, b) => (b.h.days ?? 99999) - (a.h.days ?? 99999))
  const fine  = graded.filter(x => x.h.level === 'green').sort((a, b) => (a.h.days ?? 0) - (b.h.days ?? 0))

  async function logContact(c: ClientStats) {
    try {
      await addOutreach({ tenant_id: tenantId!, client_id: c.id, occurred_on: todayISO(), type: 'check_in', channel: 'text', outcome: 'responded', notes: null })
      toast(`Logged contact with ${c.name}.`)
      void reload()
    } catch (e) { toast(e instanceof Error ? e.message : 'Could not log.', 'error') }
  }

  if (loading) return <Loading />

  return (
    <div>
      <PageHeader
        title="Outreach"
        subtitle="Who needs a follow-up, and who's fine for now"
        action={<Button variant="secondary" onClick={() => setShowLog(true)} disabled={clients.length === 0}>Log a touch</Button>}
      />

      {error && <div className="mb-6"><ErrorNote message={error} /></div>}

      {clients.length === 0 ? (
        <Card><EmptyState message="No clients yet. Add clients and their follow-up status shows up here." /></Card>
      ) : (
        <div className="space-y-6">
          {/* Needs a follow-up */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
              <ContactFlag level="red" />
              <h2 className="text-sm font-semibold text-slate-800">Needs a follow-up</h2>
              <span className="text-xs text-slate-400">({needs.length})</span>
            </div>
            {needs.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">Everyone's been contacted in the last 30 days. You're good.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {needs.map(({ c, h }) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-slate-800">{c.name}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        {c.phone ? `${c.phone} · ` : ''}<span className="font-medium text-rose-600">{h.label}</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => logContact(c)}>Log contact</Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Fine for now */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
              <ContactFlag level="green" />
              <h2 className="text-sm font-semibold text-slate-800">Fine for now</h2>
              <span className="text-xs text-slate-400">({fine.length})</span>
            </div>
            {fine.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No one contacted in the last 30 days yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {fine.map(({ c, h }) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-800">{c.name}</span>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-emerald-600">{h.label}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {showLog && <OutreachModal tenantId={tenantId!} clients={clientOptions} onClose={() => setShowLog(false)} onSaved={reload} />}
    </div>
  )
}
