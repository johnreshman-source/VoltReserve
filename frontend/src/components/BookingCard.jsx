import { Link } from 'react-router-dom'
import { Clock, MapPin, Zap } from 'lucide-react'
import { getStatusBadgeClass, getStatusDisplay } from '../utils/reservation'
import '../pages/pages.css'

const BookingCard = ({ reservation }) => {
  const statusClass = getStatusBadgeClass(reservation.status)

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0' }}>{reservation.station.name}</h3>
          <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
            Port {reservation.port.port_number}
          </p>
        </div>
        <span className={`badge ${statusClass}`}>{getStatusDisplay(reservation.status)}</span>
      </div>

      <div className="card-details" style={{ marginBottom: '1rem' }}>
        <div className="detail-row">
          <span className="detail-label">
            <Clock style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
            Reserved:
          </span>
          <span className="detail-value" style={{ fontSize: '0.9rem' }}>
            {new Date(reservation.reserved_at).toLocaleString()}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">
            <Zap style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
            Booking ID:
          </span>
          <span className="detail-value" style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
            {reservation.booking_id.substring(0, 12)}...
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Duration:</span>
          <span className="detail-value">{reservation.duration_minutes} minutes</span>
        </div>
      </div>

      {reservation.status === 'ACTIVE' && (
        <Link
          to={`/booking-confirmation/${reservation.id}`}
          className="btn btn-primary btn-small"
          style={{ width: '100%', textAlign: 'center' }}
        >
          View QR Code
        </Link>
      )}
    </div>
  )
}

export default BookingCard