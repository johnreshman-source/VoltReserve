import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { getPortStatusBadgeClass, getStatusDisplay } from '../utils/reservation'
import '../pages/pages.css'

const PortCard = ({ port, stationId }) => {
  const isAvailable = port.status === 'AVAILABLE'
  const statusClass = getPortStatusBadgeClass(port.status)

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0 }}>Port {port.port_number}</h3>
        <span className={`badge ${statusClass}`}>{getStatusDisplay(port.status)}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: isAvailable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(111, 111, 111, 0.1)',
          border: `2px solid ${isAvailable ? 'var(--success)' : 'var(--text-tertiary)'}`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Zap style={{
            width: '32px',
            height: '32px',
            color: isAvailable ? 'var(--success)' : 'var(--text-tertiary)',
          }} />
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
            {isAvailable ? 'Ready to Reserve' : 'Not Available'}
          </p>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
            {port.status === 'AVAILABLE' && 'No reservations'}
            {port.status === 'RESERVED' && 'Reserved'}
            {port.status === 'OCCUPIED' && 'Currently in use'}
          </p>
        </div>
      </div>

      {isAvailable ? (
        <Link
          to={`/reservation/${stationId}/${port.port_number}`}
          className="btn btn-primary"
          style={{ width: '100%', textAlign: 'center' }}
        >
          Reserve Now
        </Link>
      ) : (
        <button disabled className="btn btn-secondary" style={{ width: '100%', opacity: 0.6 }}>
          Not Available
        </button>
      )}
    </div>
  )
}

export default PortCard