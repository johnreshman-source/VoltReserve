/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371 // Earth's radius in kilometers
  
  const toRad = (deg) => (deg * Math.PI) / 180
  
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return Math.round(distance * 100) / 100 // Round to 2 decimals
}

/**
 * Check if user is within radius of station
 */
export const isWithinRadius = (userLat, userLng, stationLat, stationLng, radiusKm) => {
  const distance = calculateDistance(userLat, userLng, stationLat, stationLng)
  return distance <= radiusKm
}

/**
 * Format distance for display
 */
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance}km`
}

/**
 * Get user's current location using Geolocation API
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  })
}

/**
 * Watch user's location continuously
 * Returns a function to stop watching
 */
export const watchLocation = (callback) => {
  if (!navigator.geolocation) {
    callback(null, new Error('Geolocation is not supported'))
    return null
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }, null)
    },
    (error) => {
      callback(null, error)
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
    }
  )

  // Return function to stop watching
  return () => navigator.geolocation.clearWatch(watchId)
}