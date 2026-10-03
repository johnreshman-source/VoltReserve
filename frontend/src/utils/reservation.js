/**
 * Calculate remaining time for reservation
 */
export const getRemainingTime = (expiresAt) => {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry - now

  if (diffMs <= 0) {
    return {
      expired: true,
      seconds: 0,
      minutes: 0,
      hours: 0,
      display: 'Expired',
    }
  }

  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    expired: false,
    seconds,
    minutes,
    hours,
    totalSeconds,
    display: formatTimeRemaining(hours, minutes, seconds),
  }
}

/**
 * Format time remaining for display
 */
export const formatTimeRemaining = (hours, minutes, seconds) => {
  const parts = []
  
  if (hours > 0) {
    parts.push(`${hours}h`)
  }
  if (minutes > 0 || hours > 0) {
    parts.push(`${minutes}m`)
  }
  parts.push(`${seconds}s`)
  
  return parts.join(' ')
}

/**
 * Format countdown as MM:SS
 */
export const formatCountdown = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * Check if reservation is expiring soon (within 5 minutes)
 */
export const isExpiringSoon = (expiresAt) => {
  const timeInfo = getRemainingTime(expiresAt)
  return !timeInfo.expired && timeInfo.totalSeconds < 300
}

/**
 * Get reservation status badge color
 */
export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'ACTIVE':
      return 'badge-info'
    case 'COMPLETED':
      return 'badge-success'
    case 'EXPIRED':
      return 'badge-warning'
    case 'CANCELLED':
      return 'badge-error'
    default:
      return 'badge-primary'
  }
}

/**
 * Get status display text
 */
export const getStatusDisplay = (status) => {
  const displays = {
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    EXPIRED: 'Expired',
    CANCELLED: 'Cancelled',
    RESERVED: 'Reserved',
    OCCUPIED: 'Occupied',
    AVAILABLE: 'Available',
  }
  return displays[status] || status
}

/**
 * Get port status badge color
 */
export const getPortStatusBadgeClass = (status) => {
  switch (status) {
    case 'AVAILABLE':
      return 'badge-success'
    case 'RESERVED':
      return 'badge-info'
    case 'OCCUPIED':
      return 'badge-warning'
    default:
      return 'badge-primary'
  }
}