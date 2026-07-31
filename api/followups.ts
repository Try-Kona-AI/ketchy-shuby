// Vercel Cron function — weekly follow-up reminder.
// Scheduled by the "crons" entry in vercel.json (Wednesdays). Finds every client
// not contacted in 30+ days (or never) and texts Viscount the hit-list (Twilio).
// Falls back to / also supports email (Resend) if those env vars are set.
//
// Env vars (Vercel project settings):
//   SUPABASE_URL / VITE_SUPABASE_URL   project URL (app already sets VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY          Supabase -> Settings -> API -> service_role (secret)
//   CRON_SECRET                        random string; Vercel Cron sends it as a Bearer token
//   -- Text (Twilio) --
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (+1 number), FOLLOWUP_SMS (comma-sep numbers)
//   -- Email (optional) --
//   RESEND_API_KEY, FOLLOWUP_RECIPIENTS (comma-sep emails), FOLLOWUP_FROM (verified sender)
import { createClient } from '@supabase/supabase-js'

const FOLLOWUP_DAYS = 30
const APP_URL = 'ketchy-shuby.vercel.app/outreach'

export default async function handler(req: any, res: any) {
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
    if (!lastByClient[o.client_id] || o.occurred_on > lastByClient[o.client_id]) lastByClient[o.client_id] = o.occurred_on
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

  if (due.length === 0) return res.status(200).json({ ok: true, due: 0, note: 'no follow-ups this week' })

  const result: any = { ok: true, due: due.length }

  // ── Text (Twilio) ──────────────────────────────────────────────────────────
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const twFrom = process.env.TWILIO_FROM
  const smsTo = (process.env.FOLLOWUP_SMS || '').split(',').map(s => s.trim()).filter(Boolean)
  if (sid && token && twFrom && smsTo.length) {
    const lines = due.slice(0, 8).map(c => `• ${c.name} (${c.days === null ? 'never' : c.days + 'd'})`)
    const more = due.length > 8 ? `\n+${due.length - 8} more` : ''
    const body = `Ketchy Shuby — ${due.length} follow-up${due.length === 1 ? '' : 's'} this week:\n${lines.join('\n')}${more}\n${APP_URL}`
    const auth = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64')
    const sent: string[] = []
    for (const to of smsTo) {
      const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ From: twFrom, To: to, Body: body }).toString(),
      })
      if (r.ok) sent.push(to)
      else result.sms_error = await r.text().catch(() => 'twilio error')
    }
    result.sms_sent_to = sent
  }

  // ── Email (Resend, optional) ────────────────────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY
  const recipients = (process.env.FOLLOWUP_RECIPIENTS || '').split(',').map(s => s.trim()).filter(Boolean)
  if (resendKey && recipients.length) {
    const rows = due.map(c => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:500">${c.name}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#777">${c.phone || ''}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#c15a2e;text-align:right">${c.days === null ? 'Never contacted' : c.days + ' days'}</td></tr>`).join('')
    const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto"><h2 style="color:#2f3a24;margin:0 0 4px">Follow-ups this week</h2><p style="color:#666;margin:0 0 16px">${due.length} client${due.length === 1 ? '' : 's'} not contacted in ${FOLLOWUP_DAYS}+ days.</p><table style="border-collapse:collapse;width:100%;font-size:14px">${rows}</table><p style="margin-top:20px"><a href="https://${APP_URL}" style="color:#c15a2e;font-weight:500">Open Ketchy Shuby &rarr;</a></p><p style="color:#aaa;font-size:12px;margin-top:24px">Powered by Kona AI</p></div>`
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.FOLLOWUP_FROM || 'Ketchy Shuby <followups@trykona.com>', to: recipients, subject: `Follow-ups: ${due.length} to contact this week`, html }),
    })
    result.email_sent_to = r.ok ? recipients : undefined
    if (!r.ok) result.email_error = await r.text().catch(() => 'resend error')
  }

  if (!result.sms_sent_to && !result.email_sent_to) {
    result.note = 'computed; not sent (set Twilio env vars for text, or Resend for email)'
    result.preview = due
  }
  return res.status(200).json(result)
}
