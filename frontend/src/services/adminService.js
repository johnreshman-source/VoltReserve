import api from './api'

const adminService = {
  /**
   * Get admin dashboard stats
   */
  getStats: async () => {
    try {
      const response = await api.get('/admin/stats')
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch stats',
        status: error.response?.status,
      }
    }
  },

  /**
   * Get all users
   */
  getUsers: async (page = 1, perPage = 20) => {
    try {
      const response = await api.get('/admin/users', {
        params: { page, per_page: perPage },
      })
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch users',
        status: error.response?.status,
      }
    }
  },

  /**
   * Get user details
   */
  getUserDetails: async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`)
      return response.data.user
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch user',
        status: error.response?.status,
      }
    }
  },

  /**
   * Update user admin status
   */
  updateUserAdminStatus: async (userId, isAdmin) => {
    try {
      const response = await api.put(`/admin/users/${userId}/admin`, {
        is_admin: isAdmin,
      })
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to update user',
        status: error.response?.status,
      }
    }
  },

  /**
   * Get all stations
   */
  getStations: async () => {
    try {
      const response = await api.get('/admin/stations')
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch stations',
        status: error.response?.status,
      }
    }
  },

  /**
   * Update station
   */
  updateStation: async (stationId, data) => {
    try {
      const response = await api.put(`/admin/stations/${stationId}`, data)
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to update station',
        status: error.response?.status,
      }
    }
  },

  /**
   * Get all reservations
   */
  getReservations: async (status = null, stationId = null, page = 1) => {
    try {
      const params = { page }
      if (status) params.status = status
      if (stationId) params.station_id = stationId

      const response = await api.get('/admin/reservations', { params })
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch reservations',
        status: error.response?.status,
      }
    }
  },

  /**
   * Cancel reservation (admin)
   */
  cancelReservation: async (reservationId, reason = '') => {
    try {
      const response = await api.post(
        `/admin/reservations/${reservationId}/cancel`,
        { reason }
      )
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to cancel reservation',
        status: error.response?.status,
      }
    }
  },

  /**
   * Get port history
   */
  getPortHistory: async (portId, days = 7) => {
    try {
      const response = await api.get(`/admin/ports/${portId}/history`, {
        params: { days },
      })
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch port history',
        status: error.response?.status,
      }
    }
  },

  /**
   * Get system health
   */
  getSystemHealth: async () => {
    try {
      const response = await api.get('/admin/health')
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch system health',
        status: error.response?.status,
      }
    }
  },

  /**
   * Get activity log
   */
  getActivityLog: async (hours = 24, limit = 50) => {
    try {
      const response = await api.get('/admin/activity', {
        params: { hours, limit },
      })
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch activity log',
        status: error.response?.status,
      }
    }
  },

  /**
   * Force expire reservation
   */
  expireReservation: async (reservationId) => {
    try {
      const response = await api.post(
        `/admin/reservations/${reservationId}/expire`
      )
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to expire reservation',
        status: error.response?.status,
      }
    }
  },

  /**
   * Reset port
   */
  resetPort: async (portId) => {
    try {
      const response = await api.post(`/admin/ports/${portId}/reset`)
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to reset port',
        status: error.response?.status,
      }
    }
  },
}

export default adminService