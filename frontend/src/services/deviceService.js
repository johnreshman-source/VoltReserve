import api from './api'

const deviceService = {
  /**
   * Get device/station status
   */
  getDeviceStatus: async (stationId) => {
    try {
      const response = await api.get(`/device/status/${stationId}`)
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch device status',
        status: error.response?.status,
      }
    }
  },

  /**
   * Update device status (typically called by ESP32)
   */
  updateDeviceStatus: async (stationId, ports) => {
    try {
      const response = await api.post('/device/status', {
        station_id: stationId,
        ports,
        esp32_id: 'ESP32_001',
      })
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to update device status',
        status: error.response?.status,
      }
    }
  },

  /**
   * Demo mode: Simulate port occupancy
   */
  demoOccupyPort: async (stationId, portNumber, occupied) => {
    try {
      const response = await api.post('/device/demo/occupy', {
        station_id: stationId,
        port_number: portNumber,
        occupied,
      })
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Demo mode failed',
        status: error.response?.status,
      }
    }
  },

  /**
   * Demo mode: Simulate ESP32 heartbeat
   */
  demoHeartbeat: async (stationId) => {
    try {
      const response = await api.post('/device/demo/heartbeat', {
        station_id: stationId,
      })
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Demo heartbeat failed',
        status: error.response?.status,
      }
    }
  },

  /**
   * Health check for device
   */
  healthCheck: async (stationId) => {
    try {
      const response = await api.get(`/device/health/${stationId}`)
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Health check failed',
        status: error.response?.status,
      }
    }
  },

  /**
   * Poll device status (real-time updates)
   */
  pollDeviceStatus: async (stationId, intervalMs = 3000) => {
    return new Promise((resolve) => {
      const pollInterval = setInterval(async () => {
        try {
          const status = await deviceService.getDeviceStatus(stationId)
          // Resolve on first successful fetch
          clearInterval(pollInterval)
          resolve(status)
        } catch (error) {
          // Continue polling on error
        }
      }, intervalMs)
    })
  },

  /**
   * Start polling device status continuously
   * Returns a function to stop polling
   */
  startPolling: (stationId, callback, intervalMs = 3000) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await deviceService.getDeviceStatus(stationId)
        callback(status, null)
      } catch (error) {
        callback(null, error)
      }
    }, intervalMs)

    // Return function to stop polling
    return () => clearInterval(pollInterval)
  },
}

export default deviceService