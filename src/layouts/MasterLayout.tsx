import { useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import logoImg from '../assets/logo-icon.png'

const MASTER_PASSWORD = (import.meta.env as Record<string, string | undefined>)['VITE_MASTER_PASSWORD'] || 'leadly-admin-2026'

const NAV_ITEMS = [
  {
    to: '/master/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/master/customers',
    label: 'Customers',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: '/master/leads',
    label: 'All Leads',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    to: '/master/replies',
    label: 'All Replies',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    to: '/master/settings',
    label: 'Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

function MasterLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === MASTER_PASSWORD) {
      sessionStorage.setItem('masterAuth', '1')
      onLogin()
    } else {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className={`bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm ${shake ? 'animate-pulse' : ''}`}>
        <div className="flex items-center gap-2 mb-6">
          <img src={logoImg} alt="BidBack" className="h-8 w-auto" />
          <span className="font-bold text-white text-lg">BidBack</span>
          <span className="text-xs bg-red-900 text-red-300 border border-red-700 px-2 py-0.5 rounded-full font-bold tracking-wider ml-1">MASTER</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-1">Master Admin</h1>
        <p className="text-sm text-gray-500 mb-6">Internal use only. Enter admin password.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false) }}
            placeholder="Admin password"
            autoFocus
            className={`w-full border rounded-lg px-4 py-2.5 text-sm text-white bg-gray-800 outline-none focus:ring-2 focus:ring-red-500 ${error ? 'border-red-500' : 'border-gray-700'}`}
          />
          {error && <p className="text-xs text-red-400">Incorrect password.</p>}
          <button
            type="submit"
            className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            Enter Master Admin
          </button>
        </form>
        <p className="text-xs text-gray-600 mt-6 text-center">BidBack Internal — Authorized Access Only</p>
      </div>
    </div>
  )
}

export default function MasterLayout() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('masterAuth') === '1')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  if (!authed) {
    return <MasterLogin onLogin={() => setAuthed(true)} />
  }

  function handleLogout() {
    sessionStorage.removeItem('masterAuth')
    setAuthed(false)
    navigate('/master')
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-gray-900 border-r border-gray-800 flex flex-col
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-2 px-5 h-16 border-b border-gray-800">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImg} alt="BidBack" className="h-8 w-auto" />
            <span className="font-bold text-white text-lg">BidBack</span>
          </Link>
          <span className="text-[10px] bg-red-900 text-red-300 border border-red-700 px-1.5 py-0.5 rounded font-bold tracking-wider ml-auto">MASTER</span>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 mb-2">Admin</p>
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-red-700 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
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

        <div className="px-4 py-3 border-t border-gray-800">
          <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-700 text-white text-xs flex items-center justify-center font-bold">J</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">Jackson</div>
              <div className="text-xs text-gray-500 truncate">Master Admin</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-xs text-gray-600 hover:text-red-400 transition-colors text-left px-1 py-1"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center px-4 sm:px-6 gap-4 shrink-0">
          <button
            className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-800"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-red-300 bg-red-900/50 border border-red-700 px-2.5 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              Master Admin
            </span>
            <Link to="/" className="text-sm text-gray-500 hover:text-white transition-colors">← Site</Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
