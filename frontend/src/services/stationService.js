import api from './api'

const stationService = {
  /**
   * Get all active stations
   */
  getAllStations: async (latitude = null, longitude = null, region = 'tamil_nadu') => {
    try {
      const params = {}
      if (latitude !== null) params.latitude = latitude
      if (longitude !== null) params.longitude = longitude
      if (region) params.region = region
      
      const response = await api.get('/stations/combined', { params })
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch stations',
        status: error.response?.status,
      }
    }
  },

  /**
   * Get single station with all details
   */
  getStation: async (stationId) => {
    try {
      const response = await api.get(`/stations/${stationId}`)
      return response.data.station
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch station',
        status: error.response?.status,
      }
    }
  },

  /**
   * Get nearby stations within user's radius
   */
  getNearbyStations: async (radius = 2) => {
    try {
      const response = await api.get('/stations/nearby', {
        params: { radius },
      })
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch nearby stations',
        status: error.response?.status,
      }
    }
  },

  /**
   * Get specific port status
   */
  getPortStatus: async (stationId, portNumber) => {
    try {
      const response = await api.get(
        `/stations/${stationId}/ports/${portNumber}`
      )
      return response.data.port
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch port status',
        status: error.response?.status,
      }
    }
  },

  /**
   * Get station summary (quick status)
   */
  getStationSummary: async (stationId) => {
    try {
      const response = await api.get(`/stations/${stationId}/summary`)
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch station summary',
        status: error.response?.status,
      }
    }
  },

  /**
   * Poll for station status updates (used for real-time updates)
   */
  pollStationStatus: async (stationId, intervalMs = 2000) => {
    return new Promise((resolve) => {
      const pollInterval = setInterval(async () => {
        try {
          const summary = await stationService.getStationSummary(stationId)
          // Resolve on first successful fetch
          clearInterval(pollInterval)
          resolve(summary)
        } catch (error) {
          // Continue polling on error
        }
      }, intervalMs)
    })
  },
}

export default stationService