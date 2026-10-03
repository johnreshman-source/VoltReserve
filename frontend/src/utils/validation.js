/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return pattern.test(email)
}

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  if (!password) return { valid: false, message: 'Password is required' }
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' }
  }
  return { valid: true, message: '' }
}

/**
 * Validate name
 */
export const validateName = (name) => {
  if (!name || name.trim() === '') {
    return { valid: false, message: 'Name is required' }
  }
  if (name.length > 50) {
    return { valid: false, message: 'Name must be less than 50 characters' }
  }
  return { valid: true, message: '' }
}

/**
 * Validate phone number
 */
export const validatePhone = (phone) => {
  if (!phone) return { valid: true, message: '' } // Optional
  const pattern = /^\d{10,15}$/
  const cleaned = phone.replace(/\s|-/g, '')
  if (!pattern.test(cleaned)) {
    return { valid: false, message: 'Invalid phone number' }
  }
  return { valid: true, message: '' }
}

/**
 * Validate coordinates
 */
export const validateCoordinates = (lat, lng) => {
  const latitude = parseFloat(lat)
  const longitude = parseFloat(lng)

  if (isNaN(latitude) || isNaN(longitude)) {
    return { valid: false, message: 'Invalid coordinates' }
  }
  if (latitude < -90 || latitude > 90) {
    return { valid: false, message: 'Latitude must be between -90 and 90' }
  }
  if (longitude < -180 || longitude > 180) {
    return { valid: false, message: 'Longitude must be between -180 and 180' }
  }

  return { valid: true, message: '' }
}

/**
 * Validate registration form
 */
export const validateRegistrationForm = (formData) => {
  const errors = {}

  const emailValidation = validateEmail(formData.email)
  if (!emailValidation) errors.email = 'Invalid email format'

  const passwordValidation = validatePassword(formData.password)
  if (!passwordValidation.valid) errors.password = passwordValidation.message

  const firstNameValidation = validateName(formData.firstName)
  if (!firstNameValidation.valid) errors.firstName = firstNameValidation.message

  const lastNameValidation = validateName(formData.lastName)
  if (!lastNameValidation.valid) errors.lastName = lastNameValidation.message

  if (formData.phone) {
    const phoneValidation = validatePhone(formData.phone)
    if (!phoneValidation.valid) errors.phone = phoneValidation.message
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate login form
 */
export const validateLoginForm = (formData) => {
  const errors = {}

  if (!validateEmail(formData.email)) {
    errors.email = 'Invalid email format'
  }

  if (!formData.password) {
    errors.password = 'Password is required'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}