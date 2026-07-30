import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase, DEMO } from '../lib/supabase'
import { Card, PageHeader, TextField, Button, ErrorNote } from '../components/ui'
import { useToast } from '../hooks/useToast'

export default function Settings() {
  const { user, tenantId, tenantName, refreshTenant } = useAuth()
  const { toast } = useToast()
  const [name, setName]     = useState(tenantName ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    if (!tenantId) return
    setSaving(true); setError(null)
    if (DEMO) { toast('Saved (demo mode).'); setSaving(false); return }
    const { error } = await supabase.from('tenants').update({ name: name.trim() }).eq('id', tenantId)
    if (error) setError(error.message)
    else { toast('Workspace name saved.'); await refreshTenant() }
    setSaving(false)
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your workspace." />

      <div className="max-w-lg space-y-6">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-800">Workspace</h2>
          <p className="mt-0.5 mb-4 text-sm text-slate-500">The name shown in the sidebar.</p>
          {error && <div className="mb-4"><ErrorNote message={error} /></div>}
          <form onSubmit={saveName} className="flex items-end gap-3">
            <div className="flex-1"><TextField label="Workspace name" value={name} onChange={e => setName(e.target.value)} /></div>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-800">Account</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Signed in as</dt><dd className="font-medium text-slate-800">{user?.email}</dd></div>
          </dl>
        </Card>

        <p className="text-center text-xs text-slate-400">Powered by Kona AI</p>
      </div>
    </div>
  )
}
