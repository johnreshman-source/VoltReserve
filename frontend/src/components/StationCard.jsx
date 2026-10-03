import { Link } from 'react-router-dom'
import { MapPin, Zap } from 'lucide-react'
import '../pages/pages.css'

const StationCard = ({ station }) => {
  const isExternal = station.is_external !== false && station.is_external !== undefined;
  const availablePorts = isExternal ? 0 : station.ports.filter(p => p.status === 'AVAILABLE').length

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: isExternal ? '1.1rem' : '1.25rem' }}>{station.name}</h3>
          {!isExternal ? (
            availablePorts > 0 ? (
              <span className="badge badge-success">{availablePorts} Available</span>
            ) : (
              <span className="badge badge-warning">Full</span>
            )
          ) : (
            <span className="badge" style={{ background: '#3b82f6', color: 'white' }}>External</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
          <MapPin style={{ width: '16px', height: '16px' }} />
          <span>{station.address}</span>
        </div>
      </div>

      <div className="card-details" style={{ marginBottom: '1.5rem', flex: 1 }}>
        <div className="detail-row">
          <span className="detail-label">Distance:</span>
          <span className="detail-value">{station.distance?.toFixed(2)}km</span>
        </div>
        {!isExternal ? (
          <>
            <div className="detail-row">
              <span className="detail-label">Available/Total:</span>
              <span className="detail-value">{availablePorts}/{station.ports.length}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Reserved:</span>
              <span className="detail-value">{station.ports.filter(p => p.status === 'RESERVED').length}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Occupied:</span>
              <span className="detail-value">{station.ports.filter(p => p.status === 'OCCUPIED').length}</span>
            </div>
          </>
        ) : (
          <>
            <div className="detail-row">
              <span className="detail-label">Operator:</span>
              <span className="detail-value">{station.operator || 'Unknown'}</span>
            </div>
            <div className="detail-row" style={{ marginTop: '0.5rem' }}>
              <span className="detail-label" style={{ color: 'var(--info)' }}>ℹ️ No direct reservation</span>
            </div>
          </>
        )}
      </div>

      {!isExternal && (
        <Link to={`/stations/${station.id}`} className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
          View Details
        </Link>
      )}
    </div>
  )
}

export default StationCard