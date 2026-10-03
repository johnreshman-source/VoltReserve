import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, Phone, ArrowRight, CheckCircle } from 'lucide-react'
import authService from '../services/authService'
import ErrorMessage from '../components/ErrorMessage'
import { validateRegistrationForm } from '../utils/validation'
import './pages.css'

const Register = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  })
  const [errors, setErrors] = useState({})
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setErrors({})

    if (!agreedToTerms) {
      setError('Please agree to the Terms & Conditions to continue')
      return
    }

    // Validate form
    const validation = validateRegistrationForm(formData)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setLoading(true)

    try {
      const result = await authService.register(formData)
      
      if (result.user) {
        // Redirect to dashboard on success
        navigate('/dashboard')
      }
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors)
      } else {
        setError(err.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-header">
            <h1>Join VoltReserve</h1>
            <p>Create your account and start reserving charging slots</p>
          </div>

          {error && <ErrorMessage title="Registration Error" message={error} />}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  disabled={loading}
                  className={errors.email ? 'input-error' : ''}
                />
              </div>
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            {/* First Name Field */}
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <div className="input-wrapper">
                <User className="input-icon" />
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                  disabled={loading}
                  className={errors.firstName ? 'input-error' : ''}
                />
              </div>
              {errors.firstName && <span className="field-error">{errors.firstName}</span>}
            </div>

            {/* Last Name Field */}
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <div className="input-wrapper">
                <User className="input-icon" />
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  disabled={loading}
                  className={errors.lastName ? 'input-error' : ''}
                />
              </div>
              {errors.lastName && <span className="field-error">{errors.lastName}</span>}
            </div>

            {/* Phone Field (Optional) */}
            <div className="form-group">
              <label htmlFor="phone">Phone Number (Optional)</label>
              <div className="input-wrapper">
                <Phone className="input-icon" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  disabled={loading}
                  className={errors.phone ? 'input-error' : ''}
                />
              </div>
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="At least 6 characters"
                  disabled={loading}
                  className={errors.password ? 'input-error' : ''}
                />
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
              <p className="password-hint">Must be at least 6 characters long</p>
            </div>

            {/* Terms & Conditions */}
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  disabled={loading}
                />
                <span>
                  I agree to the{' '}
                  <a href="#terms" className="auth-link">
                    Terms & Conditions
                  </a>
                  {' '}and{' '}
                  <a href="#privacy" className="auth-link">
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={loading || !agreedToTerms}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ marginRight: '0.5rem' }}></span>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight style={{ width: '18px', height: '18px', marginLeft: '0.5rem' }} />
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Illustration/Info Side */}
        <div className="auth-info">
          <div className="info-content">
            <h2>Why Register?</h2>
            <div className="info-benefits">
              <div className="benefit-item">
                <CheckCircle style={{ width: '24px', height: '24px', color: 'var(--primary)' }} />
                <div>
                  <h4>Easy Booking</h4>
                  <p>Reserve charging slots in seconds</p>
                </div>
              </div>
              <div className="benefit-item">
                <CheckCircle style={{ width: '24px', height: '24px', color: 'var(--primary)' }} />
                <div>
                  <h4>Real-Time Updates</h4>
                  <p>Get instant notifications about your reservations</p>
                </div>
              </div>
              <div className="benefit-item">
                <CheckCircle style={{ width: '24px', height: '24px', color: 'var(--primary)' }} />
                <div>
                  <h4>Secure Account</h4>
                  <p>Your data is protected with enterprise-grade encryption</p>
                </div>
              </div>
              <div className="benefit-item">
                <CheckCircle style={{ width: '24px', height: '24px', color: 'var(--primary)' }} />
                <div>
                  <h4>Track History</h4>
                  <p>View all your past bookings and charging sessions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register