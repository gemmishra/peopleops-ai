import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BrandMark } from '../common/BrandMark.jsx'
import { useAuth } from '../../hooks/useAuth.js'

const primaryNavigation = [
  {
    label: 'Dashboard',
    symbol: 'D',
    to: '/dashboard',
  },
  {
    label: 'Upload Payroll',
    symbol: 'U',
    to: '/upload-payroll',
  },
  {
    label: 'Payroll Batches',
    symbol: 'B',
    to: '/payroll-batches',
  },
  {
    label: 'Audit Logs',
    symbol: 'A',
    to: '/audit-logs',
  },
]

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-header">
          <BrandMark />
          <button
            className="sidebar-close d-lg-none"
            type="button"
            aria-label="Close navigation"
            onClick={() => setIsSidebarOpen(false)}
          >
            X
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          <span className="sidebar-section-label">Workspace</span>
          {primaryNavigation.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              key={item.to}
              onClick={() => setIsSidebarOpen(false)}
              to={item.to}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.symbol}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="security-dot" />
          Deterministic payroll engine
        </div>
      </aside>

      {isSidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop d-lg-none"
          aria-label="Close navigation"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="app-main">
        <header className="app-header">
          <button
            className="menu-button d-lg-none"
            type="button"
            aria-label="Open navigation"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="header-title">
            <span>People Operations</span>
            <strong>Payroll Risk Workspace</strong>
          </div>

          <div className="user-menu">
            <div className="user-avatar" aria-hidden="true">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-copy d-none d-sm-flex">
              <strong>{user?.name}</strong>
              <span>
                {user?.role === 'admin' ? 'HR Administrator' : user?.role}
              </span>
            </div>
            <button
              className="btn btn-outline-secondary btn-sm logout-button"
              type="button"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
