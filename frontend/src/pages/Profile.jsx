import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, MapPin, LogOut } from 'lucide-react'
import authService from '../services/authService'
import ErrorMessage from '../components/ErrorMessage'
import '../pages/pages.css'

const Profile = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      const userData = await authService.getCurrentUser()
      setUser(userData)
      setFormData(userData)
    } catch (err) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      authService.logout()
      navigate('/')
    }
  }

  if (!user) return <Loading message="Loading profile..." />

  return (
    <div className="page-section">
      <div className="container" style={{ maxWidth: '600px' }}>
        <div className="page-header">
          <h1>My Profile</h1>
          <p>Manage your account information</p>
        </div>

        {error && <ErrorMessage title="Error" message={error} onClose={() => setError(null)} />}

        {/* Profile Card */}
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--bg-darker)',
              fontSize: '2rem',
            }}>
              {user.first_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: '0 0 0.5rem 0' }}>{user.first_name} {user.last_name}</h2>
              <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                {user.is_admin ? '👤 Administrator' : '👤 User'}
              </p>
            </div>
          </div>

          {/* User Info */}
          <div className="card-details" style={{ marginBottom: '2rem' }}>
            <div className="detail-row">
              <span className="detail-label">
                <Mail style={{ width: '18px', height: '18px', marginRight: '0.5rem' }} />
                Email
              </span>
              <span className="detail-value">{user.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">
                <User style={{ width: '18px', height: '18px', marginRight: '0.5rem' }} />
                Full Name
              </span>
              <span className="detail-value">{user.first_name} {user.last_name}</span>
            </div>
            {user.phone && (
              <div className="detail-row">
                <span className="detail-label">
                  <Phone style={{ width: '18px', height: '18px', marginRight: '0.5rem' }} />
                  Phone
                </span>
                <span className="detail-value">{user.phone}</span>
              </div>
            )}
            {user.latitude && user.longitude && (
              <div className="detail-row">
                <span className="detail-label">
                  <MapPin style={{ width: '18px', height: '18px', marginRight: '0.5rem' }} />
                  Location
                </span>
                <span className="detail-value">
                  {user.latitude.toFixed(4)}, {user.longitude.toFixed(4)}
                </span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Member Since</span>
              <span className="detail-value">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={handleLogout} className="btn btn-danger">
              <LogOut style={{ width: '18px', height: '18px', marginRight: '0.5rem' }} />
              Logout
            </button>
          </div>
        </div>

        {/* Account Settings */}
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Account Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                ✓ Notifications Enabled
              </label>
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                ✓ Location Services Active
              </label>
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                ✓ Auto-Location Update Enabled
              </label>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="card" style={{ padding: '2rem', backgroundColor: 'rgba(111, 240, 160, 0.05)' }}>
          <h3 style={{ color: 'var(--primary)', margin: '0 0 1rem 0' }}>🔒 Security</h3>
          <p style={{ color: 'var(--text-tertiary)', margin: 0 }}>
            Your account is protected with JWT authentication and encrypted passwords. 
            Ensure you log out from untrusted devices.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Profile