import { useState } from 'react'
import QRCode from 'qrcode.react'
import { Copy, Download, AlertCircle } from 'lucide-react'

const QRCodeCard = ({ bookingId, stationName, portNumber, expiresAt }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const canvas = document.querySelector(`[data-qr-booking="${bookingId}"] canvas`)
    if (canvas) {
      const link = document.createElement('a')
      link.href = canvas.toDataURL()
      link.download = `booking-${bookingId}.png`
      link.click()
    }
  }

  const isExpiringSoon = expiresAt && (new Date(expiresAt) - new Date()) < 300000 // 5 minutes

  return (
    <div className="card" style={{ padding: '2rem' }} data-qr-booking={bookingId}>
      <h3 style={{ margin: '0 0 1rem 0' }}>Verification QR Code</h3>

      {isExpiringSoon && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid var(--warning)',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '1rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
          color: 'var(--warning)',
        }}>
          <AlertCircle style={{ width: '18px', height: '18px', marginTop: '2px', flexShrink: 0 }} />
          <span style={{ fontSize: '0.9rem' }}>Your reservation is expiring soon!</span>
        </div>
      )}

      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        display: 'inline-block',
        margin: '0 auto 1.5rem',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <QRCode
          value={`VOLTRESERVE:${bookingId}|STATION:${stationName}|PORT:${portNumber}`}
          size={256}
          level="H"
          includeMargin={true}
        />
      </div>

      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: '0 0 0.5rem' }}>
          Booking ID
        </p>
        <p style={{
          fontFamily: 'monospace',
          fontSize: '0.95rem',
          background: 'rgba(111, 240, 160, 0.1)',
          padding: '0.75rem',
          borderRadius: '6px',
          margin: 0,
          wordBreak: 'break-all',
        }}>
          {bookingId}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={handleCopy}
          className="btn btn-secondary btn-small"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Copy style={{ width: '16px', height: '16px' }} />
          {copied ? 'Copied!' : 'Copy ID'}
        </button>
        <button
          onClick={handleDownload}
          className="btn btn-secondary btn-small"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Download style={{ width: '16px', height: '16px' }} />
          Download QR
        </button>
      </div>
    </div>
  )
}

export default QRCodeCard