import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import authService from '../services/authService'
import ErrorMessage from '../components/ErrorMessage'
import Loading from '../components/Loading'
import { validateLoginForm } from '../utils/validation'
import './pages.css'

const Login = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})

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

    // Validate form
    const validation = validateLoginForm(formData)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setLoading(true)

    try {
      const result = await authService.login(formData.email, formData.password)
      
      if (result.user) {
        // Redirect to dashboard on success
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Sign in to your VoltReserve account</p>
          </div>

          {error && <ErrorMessage title="Login Failed" message={error} />}

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
                  placeholder="Enter your password"
                  disabled={loading}
                  className={errors.password ? 'input-error' : ''}
                />
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="auth-extras">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="forgot-link">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ marginRight: '0.5rem' }}></span>
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight style={{ width: '18px', height: '18px', marginLeft: '0.5rem' }} />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Sign up here
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="demo-info">
            <p className="demo-label">Demo Account:</p>
            <p className="demo-text">
              Email: demo@example.com<br />
              Password: demo123
            </p>
          </div>
        </div>

        {/* Illustration/Info Side */}
        <div className="auth-info">
          <div className="info-content">
            <h2>Smart EV Charging</h2>
            <ul className="info-list">
              <li>✓ Find nearby charging stations</li>
              <li>✓ Reserve slots instantly</li>
              <li>✓ Real-time port monitoring</li>
              <li>✓ 30-minute reservation windows</li>
              <li>✓ Secure QR verification</li>
              <li>✓ Track booking history</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login