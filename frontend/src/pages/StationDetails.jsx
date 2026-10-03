import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, Wifi, AlertCircle, CheckCircle } from 'lucide-react'
import stationService from '../services/stationService'
import ErrorMessage from '../components/ErrorMessage'
import Loading from '../components/Loading'
import PortCard from '../components/PortCard'
import '../pages/pages.css'

const StationDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [station, setStation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadStationDetails()
  }, [id])

  const loadStationDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await stationService.getStation(id)
      setStation(data)
    } catch (err) {
      setError(err.message || 'Failed to load station details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading message="Loading station details..." />
  }

  if (error || !station) {
    return (
      <div className="page-section">
        <div className="container">
          <ErrorMessage title="Error" message={error || 'Station not found'} />
          <Link to="/stations" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            ← Back to Stations
          </Link>
        </div>
      </div>
    )
  }

  const availablePorts = station.ports.filter(p => p.status === 'AVAILABLE')

  return (
    <div className="page-section">
      <div className="container">
        {/* Back Button */}
        <Link to="/stations" className="btn btn-secondary btn-small" style={{ marginBottom: '1.5rem' }}>
          ← Back to Stations
        </Link>

        {/* Station Header */}
        <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
          <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: '0 0 0.5rem 0' }}>{station.name}</h1>
              <div className="flex" style={{ gap: '0.5rem', alignItems: 'center' }}>
                <MapPin style={{ width: '18px', height: '18px', color: 'var(--primary)' }} />
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{station.address}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="flex" style={{ gap: '0.5rem', justifyContent: 'flex-end', marginBottom: '0.5rem', alignItems: 'center' }}>
                <Wifi style={{ width: '18px', height: '18px', color: station.esp32_online ? 'var(--success)' : 'var(--error)' }} />
                <span className={station.esp32_online ? 'badge-success' : 'badge-error'} style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                  {station.esp32_online ? 'Online' : 'Offline'}
                </span>
              </div>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                Last heartbeat: {station.last_heartbeat ? new Date(station.last_heartbeat).toLocaleTimeString() : 'Never'}
              </p>
            </div>
          </div>

          {/* Station Info */}
          <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
            <div className="stat-card">
              <CheckCircle style={{ width: '32px', height: '32px', color: 'var(--success)' }} />
              <div>
                <p className="stat-value">{availablePorts.length}</p>
                <p className="stat-label">Available</p>
              </div>
            </div>
            <div className="stat-card">
              <AlertCircle style={{ width: '32px', height: '32px', color: 'var(--info)' }} />
              <div>
                <p className="stat-value">{station.ports.filter(p => p.status === 'RESERVED').length}</p>
                <p className="stat-label">Reserved</p>
              </div>
            </div>
            <div className="stat-card">
              <Wifi style={{ width: '32px', height: '32px', color: 'var(--warning)' }} />
              <div>
                <p className="stat-value">{station.ports.filter(p => p.status === 'OCCUPIED').length}</p>
                <p className="stat-label">Occupied</p>
              </div>
            </div>
            <div className="stat-card">
              <CheckCircle style={{ width: '32px', height: '32px', color: 'var(--primary)' }} />
              <div>
                <p className="stat-value">{station.ports.length}</p>
                <p className="stat-label">Total Ports</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ports Section */}
        <div>
          <h2 style={{ marginBottom: '1.5rem' }}>Charging Ports</h2>

          {availablePorts.length === 0 && (
            <ErrorMessage
              title="No Available Ports"
              message="All charging ports are currently reserved or occupied. Please try again later."
            />
          )}

          <div className="ports-grid">
            {station.ports.map((port) => (
              <PortCard key={port.id} port={port} stationId={station.id} />
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="card" style={{ marginTop: '2rem', padding: '2rem', backgroundColor: 'rgba(111, 240, 160, 0.05)' }}>
          <h3 style={{ color: 'var(--primary)' }}>ℹ️ How to Reserve</h3>
          <ol style={{ color: 'var(--text-secondary)' }}>
            <li>Select an <strong>AVAILABLE</strong> port from above</li>
            <li>Review the reservation details</li>
            <li>Confirm your 30-minute reservation</li>
            <li>You'll receive a unique QR code</li>
            <li>Scan the QR code at the station to unlock the port</li>
            <li>Connect your EV and start charging!</li>
          </ol>
          <p style={{ marginTop: '1rem', color: 'var(--text-tertiary)', fontSize: '0.95rem' }}>
            <strong>Note:</strong> Reservations are valid for 30 minutes. If you don't start charging within this time, the reservation will expire automatically.
          </p>
        </div>
      </div>
    </div>
  )
}

export default StationDetails