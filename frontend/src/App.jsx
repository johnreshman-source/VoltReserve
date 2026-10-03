import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './App.css'

// Components
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Loading from './components/Loading'

// Pages (we'll create these next)
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Stations from './pages/Stations'
import StationDetails from './pages/StationDetails'
import Reservation from './pages/Reservation'
import BookingConfirmation from './pages/BookingConfirmation'
import BookingHistory from './pages/BookingHistory'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

// Check if user is authenticated
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token')
  return token ? children : <Navigate to="/login" />
}

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('access_token')
  const isAdmin = localStorage.getItem('is_admin') === 'true'
  return token && isAdmin ? children : <Navigate to="/" />
}

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user has valid token on mount
    const token = localStorage.getItem('access_token')
    if (token) {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return <Loading />
  }

  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/stations" element={<ProtectedRoute><Stations /></ProtectedRoute>} />
            <Route path="/stations/:id" element={<ProtectedRoute><StationDetails /></ProtectedRoute>} />
            <Route path="/reservation/:stationId/:portId" element={<ProtectedRoute><Reservation /></ProtectedRoute>} />
            <Route path="/booking-confirmation/:reservationId" element={<ProtectedRoute><BookingConfirmation /></ProtectedRoute>} />
            <Route path="/booking-history" element={<ProtectedRoute><BookingHistory /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App