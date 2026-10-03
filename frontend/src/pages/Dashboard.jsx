import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Clock, Zap, AlertCircle, CheckCircle } from 'lucide-react'
import authService from '../services/authService'
import stationService from '../services/stationService'
import reservationService from '../services/reservationService'
import { getCurrentLocation, watchLocation } from '../utils/distance'
import ErrorMessage from '../components/ErrorMessage'
import Loading from '../components/Loading'
import CountdownTimer from '../components/CountdownTimer'
import '../pages/pages.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeReservation, setActiveReservation] = useState(null)
  const [nearbyStations, setNearbyStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const watchIdRef = useRef(null)

  useEffect(() => {
    loadDashboardData()
    return () => {
      if (watchIdRef.current) watchIdRef.current()
    }
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      setLocationError(null)

      // Get current user
      const currentUser = authService.getStoredUser()
      setUser(currentUser)

      // Try to get user location with continuous tracking
      try {
        if (watchIdRef.current) watchIdRef.current()
        watchIdRef.current = watchLocation(async (location, err) => {
          if (err) {
            setLocationError('Unable to track your live location.')
            return
          }
          await authService.updateLocation(location.latitude, location.longitude)
          const updated = await authService.getCurrentUser()
          if (updated.latitude && updated.longitude) {
            const nearby = await stationService.getNearbyStations()
            setNearbyStations(nearby.stations || [])
          }
        })
      } catch (locErr) {
        setLocationError('Unable to access your location. Please enable location services.')
      }

      // Get active reservation
      const reservation = await reservationService.getActiveReservation()
      setActiveReservation(reservation)
      setLoading(false)
    } catch (err) {
      setError(err.message || 'Failed to load dashboard')
      setLoading(false)
    }
  }

  const handleCancelReservation = async () => {
    if (!activeReservation || !window.confirm('Are you sure you want to cancel this reservation?')) {
      return
    }

    try {
      await reservationService.cancelReservation(activeReservation.id)
      setActiveReservation(null)
      await loadDashboardData()
    } catch (err) {
      setError(err.message || 'Failed to cancel reservation')
    }
  }

  if (loading) {
    return <Loading message="Loading your dashboard..." />
  }

  return (
    <div className="page-section">
      <div className="container">
        {/* Welcome Section */}
        <div className="page-header">
          <h1>Welcome back, {user?.first_name}! 👋</h1>
          <p>Manage your EV charging reservations and discover nearby stations</p>
        </div>

        {error && <ErrorMessage title="Dashboard Error" message={error} onClose={() => setError(null)} />}
        {locationError && <ErrorMessage title="Location Alert" message={locationError} onClose={() => setLocationError(null)} />}

        {/* Active Reservation Card */}
        <div className="dashboard-grid">
          <div className="dashboard-section">
            <h2 style={{ marginBottom: '1.5rem' }}>Active Reservation</h2>

            {activeReservation ? (
              <div className="card" style={{ padding: '2rem' }}>
                <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{activeReservation.station.name}</h3>
                    <p style={{ color: 'var(--text-tertiary)', margin: '0.5rem 0 0 0' }}>
                      Port {activeReservation.port.port_number}
                    </p>
                  </div>
                  <span className="badge badge-info">ACTIVE</span>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <CountdownTimer expiresAt={activeReservation.expires_at} />
                </div>

                <div className="card-details">
                  <div className="detail-row">
                    <span className="detail-label">Booking ID:</span>
                    <span className="detail-value">{activeReservation.booking_id.substring(0, 12)}...</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">{activeReservation.status}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <Link
                    to={`/booking-confirmation/${activeReservation.id}`}
                    className="btn btn-primary"
                  >
                    View QR Code
                  </Link>
                  <button
                    onClick={handleCancelReservation}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="card empty-card">
                <Clock style={{ width: '48px', height: '48px', opacity: 0.3 }} />
                <h3 style={{ marginTop: '1rem' }}>No Active Reservation</h3>
                <p style={{ color: 'var(--text-tertiary)' }}>You don't have any active reservations at the moment.</p>
                <Link to="/stations" className="btn btn-primary">
                  Find & Reserve a Station
                </Link>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="dashboard-section">
            <h2 style={{ marginBottom: '1.5rem' }}>Quick Stats</h2>

            <div className="stats-grid">
              <div className="stat-card">
                <Zap style={{ width: '32px', height: '32px', color: 'var(--primary)' }} />
                <div>
                  <p className="stat-value">0</p>
                  <p className="stat-label">Charging Today</p>
                </div>
              </div>

              <div className="stat-card">
                <CheckCircle style={{ width: '32px', height: '32px', color: 'var(--success)' }} />
                <div>
                  <p className="stat-value">0</p>
                  <p className="stat-label">Completed Bookings</p>
                </div>
              </div>

              <div className="stat-card">
                <MapPin style={{ width: '32px', height: '32px', color: 'var(--info)' }} />
                <div>
                  <p className="stat-value">{nearbyStations.length}</p>
                  <p className="stat-label">Nearby Stations</p>
                </div>
              </div>

              <div className="stat-card">
                <Clock style={{ width: '32px', height: '32px', color: 'var(--warning)' }} />
                <div>
                  <p className="stat-value">30m</p>
                  <p className="stat-label">Reservation Time</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nearby Stations */}
        <div style={{ marginTop: '3rem' }}>
          <div className="section-title" style={{ marginBottom: '2rem' }}>
            <h2>Nearby Charging Stations</h2>
            <p>Stations within 2km of your location</p>
          </div>

          {nearbyStations.length > 0 ? (
            <div className="stations-grid">
              {nearbyStations.slice(0, 3).map((station) => (
                <div key={station.id} className="card">
                  <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>{station.name}</h3>
                    <span className="badge badge-success">
                      {station.ports.filter(p => p.status === 'AVAILABLE').length} Available
                    </span>
                  </div>

                  <div className="card-details">
                    <div className="detail-row">
                      <span className="detail-label">📍 Distance:</span>
                      <span className="detail-value">{station.distance?.toFixed(2)}km</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">⚡ Available:</span>
                      <span className="detail-value">
                        {station.ports.filter(p => p.status === 'AVAILABLE').length}/{station.ports.length}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/stations/${station.id}`}
                    className="btn btn-primary"
                    style={{ marginTop: '1rem', width: '100%', textAlign: 'center' }}
                  >
                    View Station
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <AlertCircle style={{ width: '48px', height: '48px', opacity: 0.3 }} />
              <h3 style={{ marginTop: '1rem' }}>No Nearby Stations</h3>
              <p style={{ color: 'var(--text-tertiary)' }}>
                No VoltReserve stations found within 2km. Check back later or expand your search radius.
              </p>
              <Link to="/stations" className="btn btn-primary">
                Browse All Stations
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <Link to="/stations" className="btn btn-primary">
            🔍 Find Stations
          </Link>
          <Link to="/booking-history" className="btn btn-secondary">
            📋 Booking History
          </Link>
          <Link to="/profile" className="btn btn-secondary">
            👤 My Profile
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard