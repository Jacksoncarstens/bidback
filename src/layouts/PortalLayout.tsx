import { useState } from 'react'
import { NavLink, Outlet, Link, useNavigate, Navigate } from 'react-router-dom'
import logoImg from '../assets/logo-icon.png'

// Decode JWT payload without verifying signature (client-side check only)
// Real verification happens server-side on each API call
function jwtPayload(token: string): { exp?: number; sub?: string; company?: string; firstName?: string; lastName?: string; email?: string; tier?: string } | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

function isJwtValid(token: string): boolean {
  const p = jwtPayload(token)
  if (!p) return false
  if (p.exp && p.exp < Date.now() / 1000) return false
  return true
}

function isPortalAuthed(): boolean {
  // JWT token from new auth system
  const jwt = localStorage.getItem('authToken')
  if (jwt && isJwtValid(jwt)) return true
  // Legacy bb- passwords (for existing customers)
  const legacy = localStorage.getItem('portalToken')
  return !!legacy && (legacy === 'leadly2026' || /^bb-[a-f0-9]{8}$/.test(legacy))
}

function getPortalCustomerInfo(): { name: string; company: string; plan: string; contractor_id?: string } {
  const raw = localStorage.getItem('portalCustomer')
  if (raw) {
    try { return JSON.parse(raw) } catch { /* fall through */ }
  }
  // Try to fill from JWT payload
  const jwt = localStorage.getItem('authToken')
  if (jwt) {
    const p = jwtPayload(jwt)
    if (p) return {
      name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'My Account',
      company: p.company || '',
      plan: p.tier || 'Free',
      contractor_id: p.sub,
    }
  }
  return { name: 'My Account', company: '', plan: 'Free' }
}

const NAV_ITEMS = [
  {
    to: '/portal/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/portal/leads',
    label: 'My Leads',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: '/portal/upload',
    label: 'Upload Leads',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
  {
    to: '/portal/replies',
    label: 'Replies',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
]

export default function PortalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  if (!isPortalAuthed()) {
    return <Navigate to="/signin" replace />
  }

  function handleLogout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('portalToken')
    localStorage.removeItem('portalCustomer')
    navigate('/signin')
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-2 px-6 h-16 border-b border-gray-100 dark:border-gray-800">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="BidBack" className="h-8 w-auto" />
            <span className="font-bold text-gray-900 dark:text-white text-lg">BidBack</span>
          </Link>
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">Portal</span>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">My Account</p>
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#1e3a8a] text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          {(() => {
            const info = getPortalCustomerInfo()
            return (
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#f97316] text-white text-xs flex items-center justify-center font-bold shrink-0">
                  {(info.name || 'M')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 dark:text-white truncate">{info.company || info.name}</div>
                  <div className="text-xs text-gray-400 truncate">{info.plan} Plan</div>
                </div>
              </div>
            )
          })()}
          <button
            onClick={handleLogout}
            className="w-full text-xs text-gray-500 hover:text-red-500 transition-colors text-left px-1 py-1"
          >
            Sign out
          </button>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400 text-center">Powered by BidBack</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 sm:px-6 gap-4 shrink-0">
          <button
            className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
          <span className="inline-flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            Customer Portal
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
