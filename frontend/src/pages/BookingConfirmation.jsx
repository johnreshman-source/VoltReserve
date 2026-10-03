import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Copy, Download } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import reservationService from '../services/reservationService'
import qrService from '../services/qrService'
import ErrorMessage from '../components/ErrorMessage'
import Loading from '../components/Loading'
import CountdownTimer from '../components/CountdownTimer'
import '../pages/pages.css'

const BookingConfirmation = () => {
  const { reservationId } = useParams()
  const [reservation, setReservation] = useState(null)
  const [qr, setQr] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadReservation()
  }, [reservationId])

  const loadReservation = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reservationService.getReservation(reservationId)
      setReservation(data)
      const qrData = await qrService.getQRCode(reservationId)
      setQr(qrData.qr)
    } catch (err) {
      setError(err.message || 'Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyBookingId = () => {
    navigator.clipboard.writeText(reservation.booking_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQR = () => {
    const canvas = document.querySelector('.reservation-qr canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL()
    link.download = `${reservation.booking_id}.png`
    link.click()
  }

  if (loading) {
    return <Loading message="Loading booking confirmation..." />
  }

  if (error || !reservation) {
    return (
      <div className="page-section">
        <div className="container">
          <ErrorMessage title="Error" message={error || 'Booking not found'} />
          <Link to="/dashboard" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-section">
      <div className="container">
        {/* Success Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div className="reservation-qr" style={{
              width: '80px',
              height: '80px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '2px solid var(--success)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CheckCircle style={{ width: '48px', height: '48px', color: 'var(--success)' }} />
            </div>
          </div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--success)' }}>Reservation Confirmed!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Your charging slot is reserved and ready to use
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          {/* QR Code Card */}
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 1.5rem 0' }}>Your QR Code</h2>
            <p style={{ color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
              Scan this code at the charging station to verify your reservation
            </p>

            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              display: 'inline-block',
              marginBottom: '1.5rem',
            }}>
              <QRCodeCanvas
                value={qr?.data || ''}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>

            {qr && <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', wordBreak: 'break-all' }}>Secure token: {qr.token}</p>}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleDownloadQR} className="btn btn-primary btn-small">
                <Download style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                Download QR
              </button>
            </div>
          </div>

          {/* Booking Details Card */}
          <div className="card">
            <h2 style={{ margin: '0 0 1.5rem 0' }}>Booking Details</h2>

            <div className="card-details">
              <div className="detail-row">
                <span className="detail-label">Booking ID:</span>
                <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  {reservation.booking_id}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Expires At:</span>
                <span className="detail-value" style={{ fontSize: '0.9rem' }}>
                  {new Date(reservation.expires_at).toLocaleString()}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Station:</span>
                <span className="detail-value">{reservation.station.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Port:</span>
                <span className="detail-value">Port {reservation.port.port_number}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  <span className="badge badge-info">{reservation.status}</span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Reserved At:</span>
                <span className="detail-value" style={{ fontSize: '0.9rem' }}>
                  {new Date(reservation.reserved_at).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopyBookingId}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '1.5rem' }}
            >
              <Copy style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
              {copied ? 'Copied!' : 'Copy Booking ID'}
            </button>
          </div>
        </div>

        {/* Timer Section */}
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem 0' }}>Time Remaining</h2>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
            Your reservation expires in:
          </p>
          <CountdownTimer expiresAt={reservation.expires_at} />
        </div>

        {/* Instructions */}
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem', backgroundColor: 'rgba(111, 240, 160, 0.05)' }}>
          <h3 style={{ color: 'var(--primary)', margin: '0 0 1rem 0' }}>📱 Next Steps</h3>
          <ol style={{ color: 'var(--text-secondary)', paddingLeft: '1.5rem' }}>
            <li style={{ marginBottom: '0.75rem' }}>
              Head to <strong>{reservation.station.name}</strong>
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              Locate <strong>Port {reservation.port.port_number}</strong>
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              Scan the QR code above using the station scanner
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              Connect your EV cable to the port
            </li>
            <li>
              Your vehicle will start charging automatically
            </li>
          </ol>
        </div>

        {/* Important Notes */}
        <div className="card" style={{ padding: '2rem', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'var(--warning)' }}>
          <h3 style={{ color: 'var(--warning)', margin: '0 0 1rem 0' }}>⚠️ Important Notes</h3>
          <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.5rem', margin: 0 }}>
            <li>Reservation is valid for <strong>30 minutes</strong> only</li>
            <li>If you don't scan within 30 minutes, the reservation will <strong>automatically expire</strong></li>
            <li>You can <strong>cancel</strong> anytime before expiry</li>
            <li>Keep your <strong>booking ID</strong> and <strong>QR code</strong> handy</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          <Link to="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
          <Link to="/booking-history" className="btn btn-secondary">
            View All Bookings
          </Link>
        </div>
      </div>
    </div>
  )
}

export default BookingConfirmation