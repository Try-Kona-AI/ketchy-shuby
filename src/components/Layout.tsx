import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { KonaLogo } from './ui'

interface NavItem { to: string; label: string; end?: boolean; icon: React.ReactNode }

const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M.5 2A1.5 1.5 0 0 1 2 .5h4A1.5 1.5 0 0 1 7.5 2v4A1.5 1.5 0 0 1 6 7.5H2A1.5 1.5 0 0 1 .5 6V2zm2 0v4h4V2H2zm6 0A1.5 1.5 0 0 1 9.5.5H13A1.5 1.5 0 0 1 14.5 2v4A1.5 1.5 0 0 1 13 7.5H9.5A1.5 1.5 0 0 1 8 6V2zm2 0v4h3V2h-3zM.5 9.5A1.5 1.5 0 0 1 2 8h4a1.5 1.5 0 0 1 1.5 1.5V13A1.5 1.5 0 0 1 6 14.5H2A1.5 1.5 0 0 1 .5 13V9.5zm2 .5v3h4v-3H2zm6-.5A1.5 1.5 0 0 1 9.5 8H13a1.5 1.5 0 0 1 1.5 1.5V13A1.5 1.5 0 0 1 13 14.5H9.5A1.5 1.5 0 0 1 8 13V9.5zm2 .5v3h3v-3h-3z"/>
  </svg>
)
const IconOutreach = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2.5 2A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H4v2.25a.5.5 0 0 0 .82.384L8.4 12H13.5a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 13.5 2h-11zm2 3.75A.75.75 0 0 1 5.25 5h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1-.75-.75zm.75 2.25a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5h-3.5z"/>
  </svg>
)
const IconClients = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
    <path fillRule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/>
    <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
  </svg>
)
const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.474l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
  </svg>
)
const IconHelp = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 13A6 6 0 1 1 8 2a6 6 0 0 1 0 12z"/>
  </svg>
)

const navItems: NavItem[] = [
  { to: '/',         label: 'Dashboard', end: true, icon: <IconDashboard /> },
  { to: '/clients',  label: 'Clients',              icon: <IconClients /> },
  { to: '/outreach', label: 'Outreach',             icon: <IconOutreach /> },
]

const bottomItems: NavItem[] = [
  { to: '/guide',    label: 'Help & Guide', icon: <IconHelp /> },
  { to: '/settings', label: 'Settings',     icon: <IconSettings /> },
]

function NavItemBtn({ to, label, end, icon }: NavItem) {
  return (
    <NavLink
      to={to} end={end}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
          isActive
            ? 'bg-[#c15a2e] text-[#fbf3e6] shadow-sm'
            : 'text-[#b7ad95] hover:bg-white/8 hover:text-[#ece5d3]'
        }`
      }
    >
      <span className="shrink-0 opacity-80">{icon}</span>
      {label}
    </NavLink>
  )
}

export default function Layout() {
  const { user, signOut, tenantName } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => { setOpen(false) }, [location.pathname])

  const displayName = tenantName || user?.email?.split('@')[0] || 'My Business'

  const sidebar = (
    <>
      {/* Logo / branding */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <KonaLogo size={34} />
        <div className="leading-tight min-w-0">
          <div className="font-display text-[15px] font-medium tracking-wide text-[#ece5d3] truncate">{displayName}</div>
          <div className="text-[11px] text-[#8f8770]">Powered by Kona AI</div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1">
        {navItems.map(n => <NavItemBtn key={n.to} {...n} />)}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-white/10 px-3 py-3 space-y-0.5">
        {bottomItems.map(n => <NavItemBtn key={n.to} {...n} />)}
        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="mb-1 truncate px-3 text-[11px] text-slate-600">{user?.email}</div>
          <button
            onClick={() => void signOut()}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-white/8 hover:text-slate-300"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
              <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
              <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-[#2f3a24] px-4 md:hidden">
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1z" clipRule="evenodd"/>
            </svg>
          )}
        </button>
        <KonaLogo size={24} />
        <span className="font-display text-[15px] font-medium tracking-wide text-[#ece5d3] truncate">{displayName}</span>
      </header>

      {/* Drawer backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-62 flex-col bg-[#2f3a24] transition-transform duration-200 ease-in-out md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebar}
      </aside>

      {/* Main content */}
      <main className="md:ml-62">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8 fade-up">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
