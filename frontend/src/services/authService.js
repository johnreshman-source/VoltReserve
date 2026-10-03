import api from './api'

const authService = {
  /**
   * Register new user
   */
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', {
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone || null,
      })
      
      // Store tokens and user info
      if (response.data.tokens) {
        localStorage.setItem('access_token', response.data.tokens.access_token)
        localStorage.setItem('refresh_token', response.data.tokens.refresh_token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.setItem('is_admin', response.data.user.is_admin)
      }
      
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Registration failed',
        errors: error.response?.data?.errors || {},
        status: error.response?.status,
      }
    }
  },

  /**
   * Login user
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      })
      
      // Store tokens and user info
      if (response.data.tokens) {
        localStorage.setItem('access_token', response.data.tokens.access_token)
        localStorage.setItem('refresh_token', response.data.tokens.refresh_token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.setItem('is_admin', response.data.user.is_admin)
      }
      
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Login failed',
        status: error.response?.status,
      }
    }
  },

  /**
   * Logout user
   */
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('is_admin')
  },

  /**
   * Get current user info
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me')
      return response.data.user
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to fetch user',
        status: error.response?.status,
      }
    }
  },

  /**
   * Update user location
   */
  updateLocation: async (latitude, longitude) => {
    try {
      const response = await api.post('/auth/location', {
        latitude,
        longitude,
      })
      
      // Update stored user info
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      user.latitude = latitude
      user.longitude = longitude
      localStorage.setItem('user', JSON.stringify(user))
      
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.error || 'Failed to update location',
        status: error.response?.status,
      }
    }
  },

  /**
   * Verify token validity
   */
  verifyToken: async () => {
    try {
      const response = await api.post('/auth/verify')
      return response.data.valid
    } catch (error) {
      return false
    }
  },

  /**
   * Get stored user from localStorage
   */
  getStoredUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  /**
   * Get stored token
   */
  getToken: () => {
    return localStorage.getItem('access_token')
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token')
  },

  /**
   * Check if user is admin
   */
  isAdmin: () => {
    return localStorage.getItem('is_admin') === 'true'
  },
}

export default authService