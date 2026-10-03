import { useEffect, useState } from 'react'
import { Users, Activity, Server, AlertCircle, TrendingUp, CheckCircle, Clock } from 'lucide-react'
import adminService from '../services/adminService'
import qrService from '../services/qrService'
import ErrorMessage from '../components/ErrorMessage'
import Loading from '../components/Loading'
import '../pages/pages.css'

const Admin = () => {
  const [stats, setStats] = useState(null)
  const [health, setHealth] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [qrInput, setQrInput] = useState('')
  const [qrResult, setQrResult] = useState(null)
  const [qrError, setQrError] = useState(null)
  const [verifyingQr, setVerifyingQr] = useState(false)

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [statsData, healthData, activityData] = await Promise.all([
        adminService.getStats(),
        adminService.getSystemHealth(),
        adminService.getActivityLog(),
      ])

      setStats(statsData)
      setHealth(healthData)
      setActivity(activityData.activity || [])
    } catch (err) {
      setError(err.message || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyQr = async (event) => {
    event.preventDefault()
    if (!qrInput.trim()) return

    try {
      setVerifyingQr(true)
      setQrError(null)
      setQrResult(await qrService.verifyAdminQRCode(qrInput.trim()))
    } catch (err) {
      setQrResult(null)
      setQrError(err.message || 'QR code verification failed')
    } finally {
      setVerifyingQr(false)
    }
  }

  if (loading) {
    return <Loading message="Loading admin dashboard..." />
  }

  return (
    <div className="page-section">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <h1>Admin Dashboard</h1>
          <p>System monitoring and management</p>
        </div>

        {error && <ErrorMessage title="Error" message={error} onClose={() => setError(null)} />}

        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 0.5rem 0' }}>Verify Reservation QR</h2>
          <p style={{ color: 'var(--text-tertiary)', marginTop: 0 }}>
            Scan with a USB/Bluetooth QR scanner or paste the QR content below.
          </p>
          <form onSubmit={handleVerifyQr}>
            <textarea
              value={qrInput}
              onChange={(event) => setQrInput(event.target.value)}
              placeholder="VOLTRESERVE|TOKEN:..."
              rows={3}
              style={{ width: '100%', resize: 'vertical', marginBottom: '1rem' }}
            />
            <button type="submit" className="btn btn-primary" disabled={verifyingQr || !qrInput.trim()}>
              {verifyingQr ? 'Verifying...' : 'Verify QR Code'}
            </button>
          </form>
          {qrError && <p style={{ color: 'var(--error)', marginBottom: 0 }}>{qrError}</p>}
          {qrResult?.valid && (
            <div style={{ marginTop: '1rem', color: 'var(--success)' }}>
              <strong>Valid reservation</strong>
              <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                {qrResult.reservation.station_name} · Port {qrResult.reservation.port_number}
                <br />Expires: {new Date(qrResult.reservation.expires_at).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="filter-tabs" style={{ marginBottom: '2rem' }}>
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'stations', label: '⚡ Stations' },
            { id: 'users', label: '👥 Users' },
            { id: 'reservations', label: '📋 Reservations' },
            { id: 'activity', label: '📈 Activity' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`filter-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div>
            {/* Key Metrics */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginBottom: '1.5rem' }}>Key Metrics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <Users style={{ width: '32px', height: '32px', color: 'var(--primary)' }} />
                  <div>
                    <p className="stat-value">{stats.users.total}</p>
                    <p className="stat-label">Total Users</p>
                  </div>
                </div>

                <div className="stat-card">
                  <TrendingUp style={{ width: '32px', height: '32px', color: 'var(--info)' }} />
                  <div>
                    <p className="stat-value">{stats.users.admins}</p>
                    <p className="stat-label">Admins</p>
                  </div>
                </div>

                <div className="stat-card">
                  <Server style={{ width: '32px', height: '32px', color: 'var(--success)' }} />
                  <div>
                    <p className="stat-value">{stats.stations.total}</p>
                    <p className="stat-label">Stations</p>
                  </div>
                </div>

                <div className="stat-card">
                  <CheckCircle style={{ width: '32px', height: '32px', color: 'var(--primary)' }} />
                  <div>
                    <p className="stat-value">{stats.stations.online}</p>
                    <p className="stat-label">Online</p>
                  </div>
                </div>

                <div className="stat-card">
                  <AlertCircle style={{ width: '32px', height: '32px', color: 'var(--warning)' }} />
                  <div>
                    <p className="stat-value">{stats.stations.offline}</p>
                    <p className="stat-label">Offline</p>
                  </div>
                </div>

                <div className="stat-card">
                  <Clock style={{ width: '32px', height: '32px', color: 'var(--primary)' }} />
                  <div>
                    <p className="stat-value">{stats.reservations.active}</p>
                    <p className="stat-label">Active Reservations</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reservations Overview */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginBottom: '1.5rem' }}>Reservation Statistics</h2>
              <div className="grid-3">
                <div className="card">
                  <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary)' }}>Total</h3>
                  <p className="stat-value" style={{ margin: 0 }}>{stats.reservations.total}</p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>
                    All time reservations
                  </p>
                </div>

                <div className="card">
                  <h3 style={{ margin: '0 0 1rem 0', color: 'var(--info)' }}>Active</h3>
                  <p className="stat-value" style={{ margin: 0, color: 'var(--info)' }}>{stats.reservations.active}</p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>
                    Currently active
                  </p>
                </div>

                <div className="card">
                  <h3 style={{ margin: '0 0 1rem 0', color: 'var(--success)' }}>Completed</h3>
                  <p className="stat-value" style={{ margin: 0, color: 'var(--success)' }}>{stats.reservations.completed}</p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>
                    Finished sessions
                  </p>
                </div>

                <div className="card">
                  <h3 style={{ margin: '0 0 1rem 0', color: 'var(--warning)' }}>Expired</h3>
                  <p className="stat-value" style={{ margin: 0, color: 'var(--warning)' }}>{stats.reservations.expired}</p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>
                    Timed out
                  </p>
                </div>

                <div className="card">
                  <h3 style={{ margin: '0 0 1rem 0', color: 'var(--error)' }}>Cancelled</h3>
                  <p className="stat-value" style={{ margin: 0, color: 'var(--error)' }}>{stats.reservations.cancelled}</p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>
                    User cancelled
                  </p>
                </div>

                <div className="card">
                  <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary)' }}>Today</h3>
                  <p className="stat-value" style={{ margin: 0 }}>{stats.reservations.today}</p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>
                    Made today
                  </p>
                </div>
              </div>
            </div>

            {/* Port Status */}
            <div>
              <h2 style={{ marginBottom: '1.5rem' }}>Port Status Overview</h2>
              <div className="grid-3">
                <div className="card">
                  <h3 style={{ margin: '0 0 1rem 0', color: 'var(--success)' }}>Available</h3>
                  <p className="stat-value" style={{ margin: 0, color: 'var(--success)' }}>{stats.ports.available}</p>
                  <div style={{ marginTop: '0.75rem', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(stats.ports.available / stats.ports.total) * 100}%`,
                      background: 'var(--success)',
                    }}></div>
                  </div>
                </div>

                <div className="card">
                  <h3 style={{ margin: '0 0 1rem 0', color: 'var(--info)' }}>Reserved</h3>
                  <p className="stat-value" style={{ margin: 0, color: 'var(--info)' }}>{stats.ports.reserved}</p>
                  <div style={{ marginTop: '0.75rem', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(stats.ports.reserved / stats.ports.total) * 100}%`,
                      background: 'var(--info)',
                    }}></div>
                  </div>
                </div>

                <div className="card">
                  <h3 style={{ margin: '0 0 1rem 0', color: 'var(--warning)' }}>Occupied</h3>
                  <p className="stat-value" style={{ margin: 0, color: 'var(--warning)' }}>{stats.ports.occupied}</p>
                  <div style={{ marginTop: '0.75rem', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(stats.ports.occupied / stats.ports.total) * 100}%`,
                      background: 'var(--warning)',
                    }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stations Tab */}
        {activeTab === 'stations' && health && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Station Status</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {health.stations.map((station) => (
                <div key={station.station_id} className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0' }}>{station.station_name}</h3>
                      <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                        {station.esp32_online ? '🟢 Online' : '🔴 Offline'}
                      </p>
                    </div>
                    <span className={`badge ${station.esp32_online ? 'badge-success' : 'badge-error'}`}>
                      {station.health.toUpperCase()}
                    </span>
                  </div>

                  <div className="card-details">
                    <div className="detail-row">
                      <span className="detail-label">Last Heartbeat:</span>
                      <span className="detail-value" style={{ fontSize: '0.9rem' }}>
                        {station.last_heartbeat ? new Date(station.last_heartbeat).toLocaleTimeString() : 'Never'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Available Ports:</span>
                      <span className="detail-value">{station.ports.available}/{3}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Reserved Ports:</span>
                      <span className="detail-value">{station.ports.reserved}/{3}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Occupied Ports:</span>
                      <span className="detail-value">{station.ports.occupied}/{3}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>User Management</h2>
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <Users style={{ width: '48px', height: '48px', opacity: 0.3 }} />
              <h3 style={{ marginTop: '1rem' }}>User Management</h3>
              <p style={{ color: 'var(--text-tertiary)' }}>
                Total Users: {stats?.users.total || 0}<br />
                Admins: {stats?.users.admins || 0}
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginTop: '1rem' }}>
                Full user management interface coming soon. You can manage users via API endpoints.
              </p>
            </div>
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Reservation Management</h2>
            <div className="grid-2">
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--info)' }}>Active Reservations</h3>
                <p className="stat-value" style={{ margin: 0, color: 'var(--info)' }}>
                  {stats?.reservations.active || 0}
                </p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>
                  Currently active bookings
                </p>
              </div>

              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--warning)' }}>Expiring Soon</h3>
                <p className="stat-value" style={{ margin: 0, color: 'var(--warning)' }}>
                  -
                </p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>
                  Expiring in &lt;5 min
                </p>
              </div>

              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--success)' }}>Completed Today</h3>
                <p className="stat-value" style={{ margin: 0, color: 'var(--success)' }}>
                  {stats?.reservations.today || 0}
                </p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>
                  Reservations made today
                </p>
              </div>

              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--error)' }}>Expired This Week</h3>
                <p className="stat-value" style={{ margin: 0, color: 'var(--error)' }}>
                  {stats?.reservations.expired || 0}
                </p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>
                  Unused reservations
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Recent Activity</h2>
            {activity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activity.slice(0, 20).map((log, idx) => (
                  <div key={idx} className="card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.25rem 0' }}>
                          {log.type === 'reservation' ? '📋' : '⚙️'} {log.station_name} - Port {log.port_number}
                        </h4>
                        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                          {log.user_email} • {log.action.toUpperCase()}
                        </p>
                      </div>
                      <span className={`badge badge-${log.status?.toLowerCase() || 'info'}`} style={{ fontSize: '0.8rem' }}>
                        {log.status}
                      </span>
                    </div>
                    <p style={{ margin: '0.75rem 0 0', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                <Activity style={{ width: '48px', height: '48px', opacity: 0.3 }} />
                <h3 style={{ marginTop: '1rem' }}>No Activity</h3>
                <p style={{ color: 'var(--text-tertiary)' }}>No recent activity found</p>
              </div>
            )}
          </div>
        )}

        {/* System Health Alert */}
        {health && health.overall_status !== 'healthy' && (
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid var(--warning)',
            borderRadius: '12px',
            color: 'var(--warning)',
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>⚠️ System Status: {health.overall_status.toUpperCase()}</h3>
            <p style={{ margin: 0 }}>
              {health.offline_stations} of {health.total_stations} stations offline. Please check ESP32 connections.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin