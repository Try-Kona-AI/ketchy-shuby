import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-3">
        <svg width="40" height="40" viewBox="0 0 34 34" fill="none">
          <rect x="1" y="1" width="32" height="32" rx="9" fill="url(#boot)"/>
          <path d="M12 9.5v15M12 17.2l6.3-6.3M13.2 16.4l6 8.1" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="23.6" cy="11" r="1.9" fill="#f5b91e"/>
          <defs>
            <linearGradient id="boot" x1="1" y1="1" x2="33" y2="33" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0a86e6"/>
              <stop offset="1" stopColor="#005aa6"/>
            </linearGradient>
          </defs>
        </svg>
        <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  )
  return user ? <>{children}</> : <Navigate to="/login" replace />
}
