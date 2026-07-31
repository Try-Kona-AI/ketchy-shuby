// Vercel Serverless Function — daily follow-up digest.
// Scheduled by the "crons" entry in vercel.json. Finds every client not
// contacted in 30+ days (or never) and emails a digest to the team.
//
// Required env vars (set in Vercel project settings):
//   SUPABASE_URL                 e.g. https://YOUR-PROJECT.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    Supabase -> Settings -> API -> service_role (secret)
//   RESEND_API_KEY               Kona Resend API key
//   FOLLOWUP_RECIPIENTS          comma-separated emails (e.g. viscount@..,alex@..)
//   FOLLOWUP_FROM                verified sender, e.g. "Ketchy Shuby <followups@trykona.com>"
//   CRON_SECRET                  random string; Vercel Cron sends it as a Bearer token
import { createClient } from '@supabase/supabase-js'

const FOLLOWUP_DAYS = 30

export default async function handler(req: any, res: any) {
  // Only Vercel Cron (or a caller with the secret) may run this.
  const secret = process.env.CRON_SECRET
  if (secret && req.headers['authorization'] !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return res.status(500).json({ error: 'Supabase env missing' })

  const supabase = createClient(url, serviceKey)

  const [{ data: clients, error: cErr }, { data: outreach, error: oErr }] = await Promise.all([
    supabase.from('clients').select('id, name, phone'),
    supabase.from('outreach').select('client_id, occurred_on'),
  ])
  if (cErr) return res.status(500).json({ error: cErr.message })
  if (oErr) return res.status(500).json({ error: oErr.message })

  const lastByClient: Record<string, string> = {}
  for (const o of outreach || []) {
    if (!lastByClient[o.client_id] || o.occurred_on > lastByClient[o.client_id]) {
      lastByClient[o.client_id] = o.occurred_on
    }
  }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = (clients || [])
    .map((c: any) => {
      const last = lastByClient[c.id]
      const days = last ? Math.round((today.getTime() - new Date(last + 'T00:00:00').getTime()) / 86400000) : null
      return { name: c.name, phone: c.phone, days }
    })
    .filter(c => c.days === null || c.days >= FOLLOWUP_DAYS)
    .sort((a, b) => (b.days ?? 99999) - (a.days ?? 99999))

  if (due.length === 0) return res.status(200).json({ ok: true, due: 0, note: 'no follow-ups today' })

  const rows = due.map(c => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:500">${c.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#777">${c.phone || ''}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#c15a2e;text-align:right">${c.days === null ? 'Never contacted' : c.days + ' days'}</td>
    </tr>`).join('')

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#2f3a24;margin:0 0 4px">Follow-ups for today</h2>
      <p style="color:#666;margin:0 0 16px">${due.length} client${due.length === 1 ? '' : 's'} not contacted in ${FOLLOWUP_DAYS}+ days.</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px">${rows}</table>
      <p style="margin-top:20px"><a href="https://ketchy-shuby.vercel.app/outreach" style="color:#c15a2e;font-weight:500">Open Ketchy Shuby &rarr;</a></p>
      <p style="color:#aaa;font-size:12px;margin-top:24px">Powered by Kona AI</p>
    </div>`

  const resendKey = process.env.RESEND_API_KEY
  const recipients = (process.env.FOLLOWUP_RECIPIENTS || '').split(',').map(s => s.trim()).filter(Boolean)
  const from = process.env.FOLLOWUP_FROM || 'Ketchy Shuby <followups@trykona.com>'

  if (!resendKey || recipients.length === 0) {
    return res.status(200).json({ ok: true, due: due.length, note: 'computed; not sent (set RESEND_API_KEY + FOLLOWUP_RECIPIENTS to enable email)', preview: due })
  }

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: recipients, subject: `Follow-ups: ${due.length} client${due.length === 1 ? '' : 's'} to contact`, html }),
  })
  const body = await r.json().catch(() => ({}))
  if (!r.ok) return res.status(500).json({ error: 'resend failed', detail: body })
  return res.status(200).json({ ok: true, due: due.length, sent_to: recipients })
}
