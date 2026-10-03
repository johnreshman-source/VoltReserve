import { AlertCircle, X } from 'lucide-react'
import { useState } from 'react'

const ErrorMessage = ({ 
  title = 'Error', 
  message, 
  onClose = null,
  dismissible = true,
  error = null 
}) => {
  const [closed, setClosed] = useState(false)

  if (closed) return null

  const handleClose = () => {
    setClosed(true)
    if (onClose) onClose()
  }

  // Handle different error object formats
  let displayMessage = message
  if (error) {
    if (typeof error === 'string') {
      displayMessage = error
    } else if (error.message) {
      displayMessage = error.message
    } else if (error.error) {
      displayMessage = error.error
    }
  }

  return (
    <div className="error-container">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <AlertCircle style={{ width: '20px', height: '20px', marginTop: '2px', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <h3>{title}</h3>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>{displayMessage}</p>
        </div>
        {dismissible && (
          <button
            onClick={handleClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'inherit', 
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorMessage