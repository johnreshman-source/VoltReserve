import api from './api'

const reservationService = {
  /**
   * Create new reservation
   */
  createReservation: async (stationId, portId) => {
    try {
      const response = await api.post('/reservations', {
        station_id: stationId,
        port_id: portId,
      })
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to create reservation',
        status: error.response?.status,
        error: error.response?.data?.error,
      }
    }
  },

  /**
   * Get all user reservations
   */
  getUserReservations: async (status = null) => {
    try {
      const params = {}
      if (status) params.status = status
      
      const response = await api.get('/reservations', { params })
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch reservations',
        status: error.response?.status,
      }
    }
  },

  /**
   * Get single reservation details
   */
  getReservation: async (reservationId) => {
    try {
      const response = await api.get(`/reservations/${reservationId}`)
      return response.data.reservation
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch reservation',
        status: error.response?.status,
      }
    }
  },

  /**
   * Get user's active reservation (if any)
   */
  getActiveReservation: async () => {
    try {
      const response = await api.get('/reservations/active')
      return response.data.reservation
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch active reservation',
        status: error.response?.status,
      }
    }
  },

  /**
   * Cancel reservation
   */
  cancelReservation: async (reservationId) => {
    try {
      const response = await api.delete(`/reservations/${reservationId}`)
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to cancel reservation',
        status: error.response?.status,
      }
    }
  },

  /**
   * Start charging (mark reservation as started)
   */
  startCharging: async (reservationId) => {
    try {
      const response = await api.post(
        `/reservations/${reservationId}/start`
      )
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to start charging',
        status: error.response?.status,
      }
    }
  },

  /**
   * Complete charging (mark reservation as completed)
   */
  completeCharging: async (reservationId) => {
    try {
      const response = await api.post(
        `/reservations/${reservationId}/complete`
      )
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to complete charging',
        status: error.response?.status,
      }
    }
  },

  /**
   * Get reservations by status
   */
  getReservationsByStatus: async (status) => {
    try {
      const response = await api.get('/reservations', {
        params: { status },
      })
      return response.data.reservations
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch reservations',
        status: error.response?.status,
      }
    }
  },
}

export default reservationService