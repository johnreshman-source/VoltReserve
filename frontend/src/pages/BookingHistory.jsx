import { useEffect, useState } from 'react'
import { Clock, CheckCircle, AlertCircle, X } from 'lucide-react'
import reservationService from '../services/reservationService'
import ErrorMessage from '../components/ErrorMessage'
import Loading from '../components/Loading'
import BookingCard from '../components/BookingCard'
import '../pages/pages.css'

const BookingHistory = () => {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    loadReservations()
  }, [statusFilter])

  const loadReservations = async () => {
    try {
      setLoading(true)
      setError(null)

      const status = statusFilter === 'ALL' ? null : statusFilter
      const data = await reservationService.getUserReservations(status)
      setReservations(data.reservations || [])
    } catch (err) {
      setError(err.message || 'Failed to load booking history')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading message="Loading booking history..." />
  }

  return (
    <div className="page-section">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <h1>Booking History</h1>
          <p>View all your reservations and charging history</p>
        </div>

        {error && <ErrorMessage title="Error" message={error} onClose={() => setError(null)} />}

        {/* Filter Tabs */}
        <div className="filter-tabs" style={{ marginBottom: '2rem' }}>
          {['ALL', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`filter-tab ${statusFilter === status ? 'active' : ''}`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Bookings */}
        {reservations.length > 0 ? (
          <div>
            <div style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Showing {reservations.length} booking{reservations.length !== 1 ? 's' : ''}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reservations.map((reservation) => (
                <BookingCard key={reservation.id} reservation={reservation} />
              ))}
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <Clock style={{ width: '48px', height: '48px', opacity: 0.3 }} />
            <h3 style={{ marginTop: '1rem' }}>No Bookings</h3>
            <p style={{ color: 'var(--text-tertiary)' }}>
              {statusFilter === 'ALL'
                ? 'You haven\'t made any reservations yet.'
                : `No ${statusFilter.toLowerCase()} bookings found.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingHistory