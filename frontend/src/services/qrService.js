import api from './api'

const qrService = {
  /**
   * Generate QR code for reservation
   */
  generateQRCode: async (reservationId) => {
    try {
      const response = await api.post('/qr/generate', {
        reservation_id: reservationId,
      })
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to generate QR code',
        status: error.response?.status,
      }
    }
  },

  /**
   * Get QR code for reservation
   */
  getQRCode: async (reservationId) => {
    try {
      const response = await api.get(`/qr/reservation/${reservationId}`)
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch QR code',
        status: error.response?.status,
      }
    }
  },

  /**
   * Verify QR code
   */
  verifyQRCode: async (qrData) => {
    try {
      const response = await api.post('/qr/verify', {
        qr_data: qrData,
      })
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'QR code verification failed',
        valid: false,
        status: error.response?.status,
      }
    }
  },

  verifyAdminQRCode: async (qrData) => {
    try {
      const response = await api.post('/qr/verify/admin', { qr_data: qrData })
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.message || error.response?.data?.error || 'QR code verification failed',
        valid: false,
        status: error.response?.status,
      }
    }
  },

  /**
   * Get QR code by booking ID
   */
  getQRByBookingId: async (bookingId) => {
    try {
      const response = await api.get(`/qr/booking/${bookingId}`)
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch QR code',
        status: error.response?.status,
      }
    }
  },
}

export default qrService