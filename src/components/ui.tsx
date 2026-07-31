import type { ReactNode } from 'react'
import type { ClientStatus, OutreachType, OutreachOutcome } from '../lib/types'

// ── KonaLogo ────────────────────────────────────────────────────────────────
export function KonaLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none">
      <rect x="1" y="1" width="32" height="32" rx="9" fill="#2f3a24"/>
      <text x="17" y="22.5" textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontSize="14.5" fontWeight="500" fill="#ece5d3" letterSpacing="0.3">KS</text>
      <circle cx="26.5" cy="8.5" r="1.9" fill="#c15a2e"/>
    </svg>
  )
}

// ── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, subtitle, onClose, children }: {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between bg-white px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z"/>
            </svg>
          </button>
        </div>
        <div className="px-6 pb-6 pt-4">{children}</div>
      </div>
    </div>
  )
}

// ── Form fields ──────────────────────────────────────────────────────────────
export function TextField({
  label, hint, ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700">
        <span>{label}</span>
        {hint && <span className="text-xs font-normal text-slate-400">{hint}</span>}
      </label>
      <input
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
        {...props}
      />
    </div>
  )
}

export function SelectField({
  label, children, ...props
}: { label: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <select
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

export function TextAreaField({
  label, hint, ...props
}: { label: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700">
        <span>{label}</span>
        {hint && <span className="text-xs font-normal text-slate-400">{hint}</span>}
      </label>
      <textarea
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
        {...props}
      />
    </div>
  )
}

export function FormActions({
  onCancel, saving, label = 'Save', danger = false,
}: {
  onCancel: () => void
  saving: boolean
  label?: string
  danger?: boolean
}) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
      <Button type="submit" variant={danger ? 'danger' : 'primary'} disabled={saving}>
        {saving ? 'Saving…' : label}
      </Button>
    </div>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  )
}

// ── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type BtnSize    = 'xs' | 'sm' | 'md'

export function Button({
  children, onClick, variant = 'primary', size = 'md', type = 'button', disabled, className = '',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: BtnVariant
  size?: BtnSize
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const sizes: Record<BtnSize, string> = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
  }

  const variants: Record<BtnVariant, string> = {
    primary:   'bg-[#2f3a24] text-[#ece5d3] hover:bg-[#3c4a2f] shadow-sm',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm',
    ghost:     'text-slate-600 hover:bg-slate-100',
    danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

// ── Badge ────────────────────────────────────────────────────────────────────
const clientColors: Record<ClientStatus, string> = {
  vip:      'bg-violet-50 text-violet-700 ring-violet-200',
  active:   'bg-emerald-50 text-emerald-700 ring-emerald-200',
  prospect: 'bg-blue-50 text-blue-700 ring-blue-200',
  dormant:  'bg-amber-50 text-amber-700 ring-amber-200',
}

const outreachTypeColors: Record<OutreachType, string> = {
  pitch:     'bg-violet-50 text-violet-700 ring-violet-200',
  follow_up: 'bg-blue-50 text-blue-700 ring-blue-200',
  check_in:  'bg-slate-100 text-slate-600 ring-slate-200',
  other:     'bg-slate-100 text-slate-600 ring-slate-200',
}

const outcomeColors: Record<OutreachOutcome, string> = {
  closed_won:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  interested:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  responded:   'bg-blue-50 text-blue-700 ring-blue-200',
  not_now:     'bg-amber-50 text-amber-700 ring-amber-200',
  no_response: 'bg-slate-100 text-slate-500 ring-slate-200',
  closed_lost: 'bg-rose-50 text-rose-700 ring-rose-200',
}

const labels: Record<string, string> = {
  vip: 'VIP', active: 'Active', prospect: 'Prospect', dormant: 'Dormant',
  check_in: 'Check-in', pitch: 'Pitch', follow_up: 'Follow-up', other: 'Note',
  no_response: 'No response', responded: 'Responded', interested: 'Interested',
  not_now: 'Not now', closed_won: 'Bought', closed_lost: 'Passed',
}

export function statusLabel(v: string): string { return labels[v] ?? v }

// ── ContactFlag ──────────────────────────────────────────────────────────────
// Cadence health: green (fresh), yellow (due soon, wk3), red (overdue, wk4+).
const flagDot: Record<'green' | 'yellow' | 'red', string> = {
  green:  'bg-emerald-500',
  yellow: 'bg-amber-500',
  red:    'bg-rose-500',
}
const flagText: Record<'green' | 'yellow' | 'red', string> = {
  green:  'text-emerald-600',
  yellow: 'text-amber-600',
  red:    'text-rose-600',
}
export function ContactFlag({ level, label }: { level: 'green' | 'yellow' | 'red'; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${flagDot[level]}`} />
      {label && <span className={`text-xs font-medium ${flagText[level]}`}>{label}</span>}
    </span>
  )
}

export function Badge({ status, kind }: { status: string; kind: 'client' | 'outreachType' | 'outcome' }) {
  const map = kind === 'client' ? clientColors : kind === 'outreachType' ? outreachTypeColors : outcomeColors
  const cls = (map as Record<string, string>)[status] ?? 'bg-slate-100 text-slate-600 ring-slate-200'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {labels[status] ?? status}
    </span>
  )
}

// ── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({
  title, subtitle, action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[#2f3a24]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Loading ──────────────────────────────────────────────────────────────────
export function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        <span className="text-sm text-slate-400">Loading…</span>
      </div>
    </div>
  )
}

// ── ErrorNote ────────────────────────────────────────────────────────────────
export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="mt-0.5 shrink-0">
        <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm-.75 4.75v3.5a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-1.5 0zM8 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
      </svg>
      <span>{message}</span>
    </div>
  )
}

// ── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({
  message, action,
}: {
  message: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" className="text-slate-400">
          <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm0 3a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4.5zm0 6.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-600">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── DeleteButton ─────────────────────────────────────────────────────────────
export function DeleteButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.748 1.748 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15z"/>
      </svg>
    </button>
  )
}

// ── Chevron toggle ───────────────────────────────────────────────────────────
export function ChevronToggle({
  open, label, count, onClick,
}: {
  open: boolean
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
    >
      <svg
        width="14" height="14" viewBox="0 0 16 16" fill="currentColor"
        className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
      >
        <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z"/>
      </svg>
      {label} ({count})
    </button>
  )
}
