import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, DEMO } from './supabase'
import { DEMO_TENANT } from './demo'

interface AuthCtx {
  user: User | null
  session: Session | null
  tenantId: string | null
  tenantName: string | null
  loading: boolean
  signOut: () => Promise<void>
  refreshTenant: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | null>(null)

/** Resolve the shared workspace, joining or creating it as needed. Several
 *  logins all land in the SAME Ketchy Shuby workspace (see join_workspace()
 *  in supabase/schema.sql). Runs server-side, so it's safe and race-free. */
async function joinWorkspace(): Promise<{ id: string; name: string } | null> {
  const { data, error } = await supabase.rpc('join_workspace')
  if (error) { console.error('join_workspace failed:', error.message); return null }
  const row = Array.isArray(data) ? data[0] : data
  return row ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<User | null>(null)
  const [session, setSession]     = useState<Session | null>(null)
  const [tenantId, setTenantId]   = useState<string | null>(null)
  const [tenantName, setTenantName] = useState<string | null>(null)
  const [loading, setLoading]     = useState(true)

  async function loadTenant(_u: User) {
    const t = await joinWorkspace()
    setTenantId(t?.id ?? null)
    setTenantName(t?.name ?? null)
  }

  useEffect(() => {
    if (DEMO) {
      // Local demo: skip auth entirely, drop straight into a fake workspace.
      setUser({ id: 'demo-user', email: 'demo@ketchyshuby.local' } as User)
      setTenantId(DEMO_TENANT)
      setTenantName('Ketchy Shuby')
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) await loadTenant(s.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_ev, s) => {
      setSession(s)
      const u = s?.user ?? null
      setUser(u)
      if (u) await loadTenant(u)
      else { setTenantId(null); setTenantName(null) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function refreshTenant() {
    if (DEMO || !user) return
    await loadTenant(user)
  }

  async function signOut() {
    if (DEMO) return
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, tenantId, tenantName, loading, signOut, refreshTenant }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
