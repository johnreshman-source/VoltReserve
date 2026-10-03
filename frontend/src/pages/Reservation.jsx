import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle } from 'lucide-react'
import reservationService from '../services/reservationService'
import stationService from '../services/stationService'
import ErrorMessage from '../components/ErrorMessage'
import Loading from '../components/Loading'
import '../pages/pages.css'

const Reservation = () => {
  const { stationId, portId } = useParams()
  const navigate = useNavigate()
  const [station, setStation] = useState(null)
  const [port, setPort] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadReservationData()
  }, [stationId, portId])

  const loadReservationData = async () => {
    try {
      setLoading(true)
      setError(null)

      const stationData = await stationService.getStation(stationId)
      setStation(stationData)

      const portData = await stationService.getPortStatus(stationId, portId)
      setPort(portData)

      if (portData.status !== 'AVAILABLE') {
        setError(`This port is currently ${portData.status} and cannot be reserved.`)
      }
    } catch (err) {
      setError(err.message || 'Failed to load reservation data')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmReservation = async () => {
    if (!station || !port) return

    setSubmitting(true)
    setError(null)

    try {
      const result = await reservationService.createReservation(parseInt(stationId), port.id)

      if (result.reservation) {
        navigate(`/booking-confirmation/${result.reservation.id}`)
      }
    } catch (err) {
      setError(err.message || err.error || 'Failed to create reservation')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Loading message="Loading reservation details..." />
  }

  if (error) {
    return (
      <div className="page-section">
        <div className="container">
          <ErrorMessage title="Error" message={error} />
          <button
            onClick={() => navigate(`/stations/${stationId}`)}
            className="btn btn-secondary"
            style={{ marginTop: '1rem' }}
          >
            ← Back to Station
          </button>
        </div>
      </div>
    )
  }

  if (!station || !port) {
    return (
      <div className="page-section">
        <div className="container">
          <ErrorMessage title="Error" message="Reservation data not found" />
        </div>
      </div>
    )
  }

  return (
    <div className="page-section">
      <div className="container">
        <h1 style={{ marginBottom: '2rem' }}>Confirm Reservation</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* Reservation Summary */}
          <div className="card">
            <h2 style={{ margin: '0 0 1.5rem 0' }}>Reservation Summary</h2>

            <div className="card-details">
              <div className="detail-row">
                <span className="detail-label">Station:</span>
                <span className="detail-value">{station.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Address:</span>
                <span className="detail-value" style={{ fontSize: '0.9rem' }}>{station.address}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Port Number:</span>
                <span className="detail-value">Port {port.port_number}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Port Status:</span>
                <span className="detail-value">
                  <span className="badge badge-success">{port.status}</span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">30 minutes</span>
              </div>
            </div>
          </div>

          {/* Key Details */}
          <div className="card">
            <h2 style={{ margin: '0 0 1.5rem 0' }}>Important Details</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <CheckCircle style={{ width: '24px', height: '24px', color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0' }}>30-Minute Window</h4>
                  <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                    Your reservation is valid for 30 minutes from confirmation
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <CheckCircle style={{ width: '24px', height: '24px', color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0' }}>Unique QR Code</h4>
                  <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                    You'll receive a unique QR code for verification
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <CheckCircle style={{ width: '24px', height: '24px', color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0' }}>Auto-Expiry</h4>
                  <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                    If unused, reservation expires automatically after 30 minutes
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <AlertCircle style={{ width: '24px', height: '24px', color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0' }}>Location Required</h4>
                  <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                    You must be within 2km to make a reservation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleConfirmReservation}
            disabled={submitting || port.status !== 'AVAILABLE'}
            className="btn btn-primary"
            style={{ padding: '1rem 2rem', fontSize: '1.05rem' }}
          >
            {submitting ? 'Confirming...' : 'Confirm Reservation'}
          </button>
          <button
            onClick={() => navigate(`/stations/${stationId}`)}
            disabled={submitting}
            className="btn btn-secondary"
            style={{ padding: '1rem 2rem', fontSize: '1.05rem' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default Reservation