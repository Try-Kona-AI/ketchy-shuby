import { useState } from 'react'
import { Modal, TextField, SelectField, TextAreaField, FormActions } from './ui'
import { useToast } from '../hooks/useToast'
import { todayISO } from '../lib/format'
import { createClient, updateClient, addOutreach, addPurchase } from '../lib/db'
import type { Client } from '../lib/types'

type ClientLite = Pick<Client, 'id' | 'name'>

// ── Client create / edit ─────────────────────────────────────────────────────
export function ClientModal({
  onClose, onSaved, tenantId, initial, defaultRep,
}: {
  onClose: () => void
  onSaved: () => void
  tenantId: string
  initial?: Client
  defaultRep?: string
}) {
  const { toast } = useToast()
  const editing = !!initial
  const [name, setName]           = useState(initial?.name ?? '')
  const [contact, setContact]     = useState(initial?.contact_name ?? '')
  const [phone, setPhone]         = useState(initial?.phone ?? '')
  const [email, setEmail]         = useState(initial?.email ?? '')
  const [company, setCompany]     = useState(initial?.company ?? '')
  const [rep, setRep]             = useState(initial?.rep ?? defaultRep ?? '')
  const [status, setStatus]       = useState(initial?.status ?? 'prospect')
  const [birthday, setBirthday]   = useState(initial?.birthday ?? '')
  const [followup, setFollowup]   = useState(initial?.next_followup_date ?? '')
  const [notes, setNotes]         = useState(initial?.notes ?? '')
  const [saving, setSaving]       = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast('Name is required.', 'error'); return }
    setSaving(true)
    const payload = {
      tenant_id: tenantId,
      name: name.trim(),
      contact_name: contact.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      company: company.trim() || null,
      rep: rep.trim() || null,
      status,
      birthday: birthday || null,
      next_followup_date: followup || null,
      notes: notes.trim() || null,
    }
    try {
      if (editing) await updateClient(initial!.id, payload)
      else await createClient(payload)
      toast(editing ? 'Client updated.' : 'Client added.')
      onSaved()
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Something went wrong.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={editing ? 'Edit client' : 'Add client'} subtitle="A person or group who buys tables." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <TextField label="Name" placeholder="e.g. Marcus / Delta Chi crew" value={name} onChange={e => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Contact name" hint="optional" placeholder="Point of contact" value={contact} onChange={e => setContact(e.target.value)} />
          <TextField label="Company / affiliation" hint="optional" placeholder="Group, org, brand" value={company} onChange={e => setCompany(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Phone" hint="optional" placeholder="(609) 555-0000" value={phone} onChange={e => setPhone(e.target.value)} />
          <TextField label="Email" hint="optional" type="email" placeholder="name@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Status" value={status} onChange={e => setStatus(e.target.value as Client['status'])}>
            <option value="prospect">Prospect</option>
            <option value="active">Active</option>
            <option value="vip">VIP</option>
            <option value="dormant">Dormant</option>
          </SelectField>
          <TextField label="Rep" hint="who owns this client" placeholder="e.g. Viscount" value={rep} onChange={e => setRep(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Birthday" hint="optional" type="date" value={birthday} onChange={e => setBirthday(e.target.value)} />
          <TextField label="Next follow-up" hint="optional" type="date" value={followup} onChange={e => setFollowup(e.target.value)} />
        </div>
        <TextAreaField label="Notes" hint="optional" placeholder="Preferences, history, who they know…" value={notes} onChange={e => setNotes(e.target.value)} />
        <FormActions onCancel={onClose} saving={saving} label={editing ? 'Save changes' : 'Add client'} />
      </form>
    </Modal>
  )
}

// ── Log outreach ─────────────────────────────────────────────────────────────
export function OutreachModal({
  onClose, onSaved, tenantId, clients, clientId,
}: {
  onClose: () => void
  onSaved: () => void
  tenantId: string
  clients: ClientLite[]
  clientId?: string
}) {
  const { toast } = useToast()
  const [client, setClient]     = useState(clientId ?? clients[0]?.id ?? '')
  const [date, setDate]         = useState(todayISO())
  const [type, setType]         = useState('check_in')
  const [channel, setChannel]   = useState('text')
  const [outcome, setOutcome]   = useState('')
  const [notes, setNotes]       = useState('')
  const [followup, setFollowup] = useState('')
  const [saving, setSaving]     = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!client) { toast('Pick a client first.', 'error'); return }
    setSaving(true)
    try {
      await addOutreach({
        tenant_id: tenantId,
        client_id: client,
        occurred_on: date,
        type: type as never,
        channel: channel as never,
        outcome: (outcome || null) as never,
        notes: notes.trim() || null,
      }, followup ? followup : (followup === '' ? undefined : null))
      toast('Outreach logged.')
      onSaved()
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Something went wrong.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Log outreach" subtitle="Every touch — a check-in, a pitch, a follow-up." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {!clientId && (
          <SelectField label="Client" value={client} onChange={e => setClient(e.target.value)}>
            {clients.length === 0 && <option value="">No clients yet</option>}
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
        )}
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <SelectField label="Type" value={type} onChange={e => setType(e.target.value)}>
            <option value="check_in">Check-in</option>
            <option value="pitch">Pitch (asked to buy)</option>
            <option value="follow_up">Follow-up</option>
            <option value="other">Note</option>
          </SelectField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Channel" value={channel} onChange={e => setChannel(e.target.value)}>
            <option value="text">Text</option>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="dm">DM</option>
            <option value="in_person">In person</option>
            <option value="other">Other</option>
          </SelectField>
          <SelectField label="Outcome" value={outcome} onChange={e => setOutcome(e.target.value)}>
            <option value="">—</option>
            <option value="no_response">No response</option>
            <option value="responded">Responded</option>
            <option value="interested">Interested</option>
            <option value="not_now">Not now</option>
            <option value="closed_won">Bought</option>
            <option value="closed_lost">Passed</option>
          </SelectField>
        </div>
        <TextAreaField label="Notes" hint="optional" placeholder="What was said, next steps…" value={notes} onChange={e => setNotes(e.target.value)} />
        <TextField label="Set next follow-up" hint="optional — appears on the dashboard" type="date" value={followup} onChange={e => setFollowup(e.target.value)} />
        <FormActions onCancel={onClose} saving={saving} label="Log it" />
      </form>
    </Modal>
  )
}

// ── Record purchase ──────────────────────────────────────────────────────────
export function PurchaseModal({
  onClose, onSaved, tenantId, clients, clientId,
}: {
  onClose: () => void
  onSaved: () => void
  tenantId: string
  clients: ClientLite[]
  clientId?: string
}) {
  const { toast } = useToast()
  const [client, setClient]   = useState(clientId ?? clients[0]?.id ?? '')
  const [event, setEvent]     = useState('')
  const [date, setDate]       = useState(todayISO())
  const [table, setTable]     = useState('')
  const [party, setParty]     = useState('')
  const [amount, setAmount]   = useState('')
  const [notes, setNotes]     = useState('')
  const [saving, setSaving]   = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!client) { toast('Pick a client first.', 'error'); return }
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt < 0) { toast('Enter a valid amount.', 'error'); return }
    setSaving(true)
    try {
      await addPurchase({
        tenant_id: tenantId,
        client_id: client,
        event_name: event.trim() || null,
        purchased_on: date,
        table_name: table.trim() || null,
        party_size: party ? parseInt(party) : null,
        amount: amt,
        notes: notes.trim() || null,
      })
      toast('Purchase recorded.')
      onSaved()
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Something went wrong.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Record a table purchase" subtitle="Builds the client's spend history." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {!clientId && (
          <SelectField label="Client" value={client} onChange={e => setClient(e.target.value)}>
            {clients.length === 0 && <option value="">No clients yet</option>}
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
        )}
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Event / night" hint="optional" placeholder="e.g. Sat 8/2 · NYE" value={event} onChange={e => setEvent(e.target.value)} />
          <TextField label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Table" hint="optional" placeholder="e.g. VIP Booth 4" value={table} onChange={e => setTable(e.target.value)} />
          <TextField label="Party size" hint="optional" type="number" min={0} placeholder="8" value={party} onChange={e => setParty(e.target.value)} />
        </div>
        <TextField label="Amount ($)" type="number" min={0} step="1" placeholder="2500" value={amount} onChange={e => setAmount(e.target.value)} />
        <TextAreaField label="Notes" hint="optional" placeholder="Bottles, comps, who came…" value={notes} onChange={e => setNotes(e.target.value)} />
        <FormActions onCancel={onClose} saving={saving} label="Record purchase" />
      </form>
    </Modal>
  )
}
