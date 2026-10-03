import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, User } from 'lucide-react'
import authService from '../services/authService'
import './Navbar.css'

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = authService.isAuthenticated()
  const isAdmin = authService.isAdmin()
  const user = authService.getStoredUser()

  const handleLogout = () => {
    authService.logout()
    setMobileMenuOpen(false)
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span>⚡</span>
          <span>VoltReserve</span>
        </Link>

        {/* Desktop Navigation */}
        <ul className="navbar-nav">
          <li>
            <Link to="/" className={isActive('/') ? 'active' : ''}>
              Home
            </Link>
          </li>
          {isAuthenticated && (
            <>
              <li>
                <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/stations" className={isActive('/stations') ? 'active' : ''}>
                  Stations
                </Link>
              </li>
              <li>
                <Link to="/booking-history" className={isActive('/booking-history') ? 'active' : ''}>
                  Bookings
                </Link>
              </li>
            </>
          )}
          {isAdmin && (
            <li>
              <Link to="/admin" className={isActive('/admin') ? 'active' : ''}>
                Admin
              </Link>
            </li>
          )}
        </ul>

        {/* Desktop Auth */}
        <div className="navbar-auth">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="flex" style={{ gap: '0.5rem', alignItems: 'center' }}>
                <User style={{ width: '18px', height: '18px' }} />
                <span style={{ fontSize: '0.95rem' }}>{user?.first_name || 'Profile'}</span>
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary btn-small">
                <LogOut style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-small">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-small">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X style={{ width: '24px', height: '24px' }} />
          ) : (
            <Menu style={{ width: '24px', height: '24px' }} />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <ul>
            <li>
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
            </li>
            {isAuthenticated && (
              <>
                <li>
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/stations" onClick={() => setMobileMenuOpen(false)}>
                    Stations
                  </Link>
                </li>
                <li>
                  <Link to="/booking-history" onClick={() => setMobileMenuOpen(false)}>
                    Bookings
                  </Link>
                </li>
                <li>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                    Profile
                  </Link>
                </li>
              </>
            )}
            {isAdmin && (
              <li>
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                  Admin
                </Link>
              </li>
            )}
          </ul>
          <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
            {isAuthenticated ? (
              <button onClick={handleLogout} className="btn btn-primary" style={{ width: '100%' }}>
                <LogOut style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                Logout
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                <Link to="/login" className="btn btn-secondary" style={{ textAlign: 'center' }}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary" style={{ textAlign: 'center' }}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar