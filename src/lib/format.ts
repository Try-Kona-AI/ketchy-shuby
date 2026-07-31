export function money(n: number | string | null | undefined): string {
  const v = typeof n === 'string' ? parseFloat(n) : (n ?? 0)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

export function shortDate(d: string | null | undefined): string {
  if (!d) return '—'
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Returns how many days ago a date was (positive = past, negative = future) */
export function daysAgo(d: string | null | undefined): number | null {
  if (!d) return null
  const then = new Date(d + 'T00:00:00').getTime()
  const now  = new Date().setHours(0, 0, 0, 0)
  return Math.round((now - then) / 86400000)
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function monthLabel(iso: string): string {
  const [y, m] = iso.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' })
}

/** Human relative label for a date, e.g. "Today", "Yesterday", "5d ago", "in 3d". */
export function timeAgo(d: string | null | undefined): string {
  const n = daysAgo(d)
  if (n === null) return 'Never'
  if (n === 0) return 'Today'
  if (n === 1) return 'Yesterday'
  if (n > 1) return `${n}d ago`
  if (n === -1) return 'Tomorrow'
  return `in ${Math.abs(n)}d`
}

/** YYYY-MM-DD for today, in local time. */
export function todayISO(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

// ── Contact cadence ──────────────────────────────────────────────────────────
// Monthly minimum. Green under 3 weeks since last contact, yellow at week 3,
// red at week 4+ (or never contacted).
export type ContactLevel = 'green' | 'yellow' | 'red'

export interface ContactHealth {
  level: ContactLevel
  label: string
  days: number | null   // days since last contact; null = never
}

// The rule: not contacted in 30 days (or never) = needs a follow-up.
export const FOLLOWUP_DAYS = 30

export function contactHealth(lastOutreachOn: string | null | undefined): ContactHealth {
  const n = daysAgo(lastOutreachOn)
  if (n === null) return { level: 'red', label: 'Never contacted', days: null }
  if (n >= FOLLOWUP_DAYS) return { level: 'red', label: `${n}d — follow up`, days: n }
  return { level: 'green', label: `${n}d ago`, days: n }
}

// ── Birthdays ────────────────────────────────────────────────────────────────
/** Days until the next occurrence of a birthday (0 = today). null if no date. */
export function daysUntilBirthday(birthday: string | null | undefined): number | null {
  if (!birthday) return null
  const [, m, d] = birthday.split('-').map(Number)
  if (!m || !d) return null
  const now = new Date(); now.setHours(0, 0, 0, 0)
  let next = new Date(now.getFullYear(), m - 1, d)
  if (next < now) next = new Date(now.getFullYear() + 1, m - 1, d)
  return Math.round((next.getTime() - now.getTime()) / 86400000)
}

/** e.g. "Aug 9" from a YYYY-MM-DD birthday. */
export function birthdayLabel(birthday: string | null | undefined): string {
  if (!birthday) return '—'
  const [, m, d] = birthday.split('-').map(Number)
  if (!m || !d) return '—'
  return new Date(2000, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
