import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type ToastKind = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  kind: ToastKind
  leaving?: boolean
}

interface ToastCtx {
  toast: (message: string, kind?: ToastKind) => void
}

const Ctx = createContext<ToastCtx | null>(null)

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = String(++counter)
    setToasts(t => [...t, { id, message, kind }])

    // Start leaving animation after 3s, remove after 3.25s
    setTimeout(() => {
      setToasts(t => t.map(x => x.id === id ? { ...x, leaving: true } : x))
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 250)
    }, 3000)
  }, [])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <ToastList toasts={toasts} dismiss={(id) => {
        setToasts(t => t.map(x => x.id === id ? { ...x, leaving: true } : x))
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 250)
      }} />
    </Ctx.Provider>
  )
}

function ToastList({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium cursor-pointer max-w-sm
            ${t.leaving ? 'toast-out' : 'toast-in'}
            ${t.kind === 'success' ? 'bg-emerald-600 text-white' : t.kind === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}
          `}
        >
          {t.kind === 'success' && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
              <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/>
            </svg>
          )}
          {t.kind === 'error' && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
              <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm-.75 4.75v3.5a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-1.5 0zM8 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
            </svg>
          )}
          {t.kind === 'info' && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
              <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm0 7.5v3a.75.75 0 0 0 1.5 0v-3a.75.75 0 0 0-1.5 0zM8 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
            </svg>
          )}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

export function ToastContainer() { return null } // rendered inside ToastProvider

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
