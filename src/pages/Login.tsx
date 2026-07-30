import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { KonaLogo } from '../components/ui'

export default function Login() {
  const nav = useNavigate()
  const [mode, setMode]         = useState<'signin' | 'signup'>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [notice, setNotice]     = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else nav('/')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      // Workspace (tenant) is auto-provisioned on first sign-in — no extra step.
      setNotice('Account created. If email confirmation is on, confirm then sign in — otherwise sign in now.')
      setMode('signin')
    }
    setLoading(false)
  }

  function switchMode() {
    setMode(m => m === 'signin' ? 'signup' : 'signin')
    setError(null)
    setNotice(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#061524] via-[#0c2340] to-[#0a1e38] p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-800/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <KonaLogo size={44} />
          <div>
            <div className="text-2xl font-bold text-white tracking-tight leading-none">Ketchy Shuby</div>
            <div className="text-xs text-slate-500 mt-0.5">Client &amp; Outreach CRM</div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white/95 backdrop-blur p-8 shadow-2xl shadow-black/30">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === 'signin' ? 'Sign in to your dashboard.' : 'Set up your login in a few seconds.'}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="mt-0.5 shrink-0">
                  <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm-.75 4.75v3.5a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-1.5 0zM8 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                </svg>
                {error}
              </div>
            )}

            {notice && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="mt-0.5 shrink-0">
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/>
                </svg>
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0c2340] py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#15315a] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-slate-500">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={switchMode} className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Powered by{' '}
          <a href="https://trykona.ai" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
            Kona AI
          </a>
        </p>
      </div>
    </div>
  )
}
