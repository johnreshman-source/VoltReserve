import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, MapPin, Clock, Smartphone, Shield, TrendingUp } from 'lucide-react'
import authService from '../services/authService'
import './pages.css'

const Home = () => {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (authService.isAuthenticated()) {
      setIsAuthenticated(true)
    }
  }, [])

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Find. Reserve. Charge.</h1>
          <p>
            VoltReserve is an IoT-powered EV charging reservation system that 
            makes finding and booking charging slots effortless.
          </p>
          <div className="hero-cta">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn btn-primary">
                  Go to Dashboard
                </Link>
                <Link to="/stations" className="btn btn-secondary">
                  Find Stations
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="container">
          <div className="section-title">
            <h2>Why VoltReserve?</h2>
            <p>Everything you need for hassle-free EV charging</p>
          </div>

          <div className="features">
            <div className="feature-card">
              <div className="feature-card-icon">
                <MapPin style={{ width: '32px', height: '32px' }} />
              </div>
              <h3>Smart Location Finding</h3>
              <p>
                Discover charging stations near you with real-time distance 
                calculation and availability status.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon">
                <Clock style={{ width: '32px', height: '32px' }} />
              </div>
              <h3>30-Minute Reservations</h3>
              <p>
                Reserve charging slots for 30 minutes. Automatic expiry ensures 
                fair access for all users.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon">
                <Smartphone style={{ width: '32px', height: '32px' }} />
              </div>
              <h3>IoT Integration</h3>
              <p>
                Real-time port status monitoring powered by ESP32 sensors. 
                Know exactly what's available.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon">
                <Zap style={{ width: '32px', height: '32px' }} />
              </div>
              <h3>QR Code Verification</h3>
              <p>
                Unique QR codes for each reservation enable quick and secure 
                verification at charging stations.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon">
                <Shield style={{ width: '32px', height: '32px' }} />
              </div>
              <h3>Secure Authentication</h3>
              <p>
                JWT-based authentication with encrypted passwords keeps your 
                account secure.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon">
                <TrendingUp style={{ width: '32px', height: '32px' }} />
              </div>
              <h3>Booking History</h3>
              <p>
                Track all your reservations and charging sessions in one place. 
                View history anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section" style={{ backgroundColor: 'rgba(111, 240, 160, 0.05)' }}>
        <div className="container">
          <div className="section-title">
            <h2>How It Works</h2>
            <p>Simple steps to reserve your charging slot</p>
          </div>

          <div className="how-it-works">
            <div className="work-step">
              <div className="step-number">1</div>
              <h3>Create Account</h3>
              <p>Sign up and verify your location to get started</p>
            </div>

            <div className="work-step">
              <div className="step-number">2</div>
              <h3>Find Nearby Stations</h3>
              <p>Discover VoltReserve stations within 2km radius</p>
            </div>

            <div className="work-step">
              <div className="step-number">3</div>
              <h3>Reserve a Port</h3>
              <p>Select an available charging port and confirm</p>
            </div>

            <div className="work-step">
              <div className="step-number">4</div>
              <h3>Get QR Code</h3>
              <p>Receive unique QR code for verification</p>
            </div>

            <div className="work-step">
              <div className="step-number">5</div>
              <h3>Verify at Station</h3>
              <p>Scan QR at the charging station to unlock port</p>
            </div>

            <div className="work-step">
              <div className="step-number">6</div>
              <h3>Start Charging</h3>
              <p>Connect your EV and enjoy uninterrupted charging</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="section">
        <div className="container">
          <div className="section-title">
            <h2>Key Features</h2>
            <p>Everything built for the modern EV driver</p>
          </div>

          <div className="features-grid">
            <div className="feature-box">
              <h4>📍 Real-Time Location</h4>
              <p>Uses browser geolocation to find stations near you instantly.</p>
            </div>

            <div className="feature-box">
              <h4>🗺️ Interactive Map</h4>
              <p>OpenStreetMap integration showing all nearby charging options.</p>
            </div>

            <div className="feature-box">
              <h4>📊 Live Status Updates</h4>
              <p>IoT sensors provide real-time charging port occupancy status.</p>
            </div>

            <div className="feature-box">
              <h4>⏱️ Smart Timer</h4>
              <p>Countdown timer ensures you never miss your reservation expiry.</p>
            </div>

            <div className="feature-box">
              <h4>📱 Mobile First</h4>
              <p>Fully responsive design works perfectly on smartphones and tablets.</p>
            </div>

            <div className="feature-box">
              <h4>🔐 Secure & Private</h4>
              <p>Enterprise-grade security with JWT authentication and encryption.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section" style={{ backgroundColor: 'rgba(111, 240, 160, 0.08)', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ marginBottom: '1rem' }}>Ready to Get Started?</h2>
          <p style={{ marginBottom: '2rem', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Join thousands of EV drivers who trust VoltReserve for their charging needs.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <Link to="/stations" className="btn btn-primary" style={{ fontSize: '1.05rem', padding: '1rem 2.5rem' }}>
                Find Charging Stations
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary" style={{ fontSize: '1.05rem', padding: '1rem 2.5rem' }}>
                  Sign Up Now
                </Link>
                <Link to="/login" className="btn btn-secondary" style={{ fontSize: '1.05rem', padding: '1rem 2.5rem' }}>
                  Already Have Account?
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="section">
        <div className="container">
          <div className="section-title">
            <h2>Built With Modern Tech</h2>
            <p>Cutting-edge technologies for reliability and performance</p>
          </div>

          <div className="tech-stack">
            <div className="tech-item">
              <h4>Frontend</h4>
              <p>React + Vite</p>
            </div>
            <div className="tech-item">
              <h4>Backend</h4>
              <p>Flask + Python</p>
            </div>
            <div className="tech-item">
              <h4>Database</h4>
              <p>MySQL</p>
            </div>
            <div className="tech-item">
              <h4>Hardware</h4>
              <p>ESP32 + Sensors</p>
            </div>
            <div className="tech-item">
              <h4>Maps</h4>
              <p>OpenStreetMap</p>
            </div>
            <div className="tech-item">
              <h4>Auth</h4>
              <p>JWT Tokens</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home