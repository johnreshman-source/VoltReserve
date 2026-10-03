import { useEffect, useState } from 'react'
import { getRemainingTime, formatCountdown, isExpiringSoon } from '../utils/reservation'

const CountdownTimer = ({ expiresAt }) => {
  const [timeInfo, setTimeInfo] = useState(null)

  useEffect(() => {
    // Initial calculation
    setTimeInfo(getRemainingTime(expiresAt))

    // Update every second
    const interval = setInterval(() => {
      setTimeInfo(getRemainingTime(expiresAt))
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  if (!timeInfo) return null

  const isExpiringSoonFlag = isExpiringSoon(expiresAt)

  return (
    <div style={{
      padding: '1.5rem',
      background: isExpiringSoonFlag ? 'rgba(245, 158, 11, 0.1)' : 'rgba(111, 240, 160, 0.1)',
      border: `2px solid ${isExpiringSoonFlag ? 'var(--warning)' : 'var(--primary)'}`,
      borderRadius: '12px',
      textAlign: 'center',
    }}>
      {timeInfo.expired ? (
        <>
          <p style={{ margin: 0, color: 'var(--error)', fontSize: '0.95rem', fontWeight: '600' }}>
            ⏰ Reservation Expired
          </p>
        </>
      ) : (
        <>
          <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            ⏱️ Time Remaining
          </p>
          <p style={{
            margin: 0,
            fontSize: '2.5rem',
            fontWeight: '800',
            fontFamily: 'monospace',
            color: isExpiringSoonFlag ? 'var(--warning)' : 'var(--primary)',
          }}>
            {formatCountdown(timeInfo.totalSeconds)}
          </p>
          {isExpiringSoonFlag && (
            <p style={{ margin: '0.75rem 0 0', color: 'var(--warning)', fontSize: '0.9rem' }}>
              ⚠️ Expiring soon!
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default CountdownTimer