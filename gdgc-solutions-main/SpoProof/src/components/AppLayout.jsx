// src/components/AppLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ShieldCheck, LayoutDashboard, ScanSearch, FileText, Award, Bell, Settings, Search, LogOut, Coins } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AppLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const sidebarLinks = [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/verify', icon: ScanSearch, label: 'Verify Media' },
    { to: '/app/reports', icon: FileText, label: 'Reports' },
    { to: '/app/certificates', icon: Award, label: 'Certificates' },
    { to: '/app/alerts', icon: Bell, label: 'Alerts' },
    { to: '/app/settings', icon: Settings, label: 'Settings' },
  ]

  const handleLogout = () => { logout(); navigate('/') }
  const initial = user?.name?.[0]?.toUpperCase() ?? 'U'
  const creditColor = user?.credits <= 2 ? 'var(--red-text)' : user?.credits <= 5 ? 'var(--amber-text)' : 'var(--green-text)'

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <NavLink to="/app/dashboard" className="navbar-logo">
            <div className="navbar-logo-icon" style={{ width: 22, height: 22 }}>
              <ShieldCheck size={12} color="#fff" />
            </div>
            SpoProof
          </NavLink>
        </div>
        <nav className="sidebar-nav">
          {sidebarLinks.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon size={16} /> {label}
            </NavLink>
          ))}
          <div style={{ flex: 1 }} />
          {/* Credits display */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            background: 'var(--bg-2)', borderRadius: 'var(--r-md)',
            border: '1px solid var(--border-1)', margin: '4px 0',
          }}>
            <Coins size={14} style={{ color: creditColor }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>Credits:</span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: creditColor, marginLeft: 'auto' }}>
              {user?.credits ?? 0}
            </span>
          </div>
          <button className="sidebar-link" onClick={handleLogout}>
            <LogOut size={16} /> Log Out
          </button>
        </nav>
      </aside>

      <main className="app-main">
        <div className="topbar">
          <div className="topbar-search">
            <Search size={14} />
            <input type="text" placeholder="Search..." />
          </div>
          <div className="topbar-right">
            <button className="btn-icon" onClick={() => navigate('/app/alerts')}>
              <Bell size={16} />
            </button>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={user.name} style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--border-2)' }} />
              : <div className="topbar-avatar">{initial}</div>
            }
          </div>
        </div>
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
