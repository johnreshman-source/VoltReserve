import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h4>VoltReserve</h4>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-tertiary)' }}>
            IoT-based EV charging slot reservation system. Find, reserve, and charge with ease.
          </p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/stations">Stations</Link>
            </li>
            <li>
              <a href="#features">Features</a>
            </li>
            <li>
              <a href="#about">About</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Resources</h4>
          <ul>
            <li>
              <a href="#docs">Documentation</a>
            </li>
            <li>
              <a href="#api">API Reference</a>
            </li>
            <li>
              <a href="#support">Support</a>
            </li>
            <li>
              <a href="#privacy">Privacy Policy</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Connect</h4>
          <ul>
            <li>
              <a href="https://twitter.com">Twitter</a>
            </li>
            <li>
              <a href="https://github.com">GitHub</a>
            </li>
            <li>
              <a href="mailto:contact@voltreserve.io">Email</a>
            </li>
            <li>
              <a href="https://linkedin.com">LinkedIn</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          &copy; {currentYear} VoltReserve. All rights reserved. | Made with ⚡ for EV enthusiasts
        </p>
      </div>
    </footer>
  )
}

export default Footer