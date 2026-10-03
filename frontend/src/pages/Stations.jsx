import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapPin, Filter, LocateFixed } from 'lucide-react'
import stationService from '../services/stationService'
import { getCurrentLocation, watchLocation, formatDistance } from '../utils/distance'
import ErrorMessage from '../components/ErrorMessage'
import Loading from '../components/Loading'
import StationCard from '../components/StationCard'
import MapView from '../components/MapView'
import '../pages/pages.css'

const Stations = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [stations, setStations] = useState([])
  const [filteredStations, setFilteredStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [sortBy, setSortBy] = useState('distance')
  const [userLocation, setUserLocation] = useState(null)
  const watchIdRef = useRef(null)

  useEffect(() => {
    loadStations()
    return () => {
      if (watchIdRef.current) watchIdRef.current()
    }
  }, [])

  useEffect(() => {
    filterAndSortStations()
  }, [stations, searchQuery, sortBy])

  const loadStations = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get user location
      let currentLocation = null
      try {
        currentLocation = await getCurrentLocation()
        setUserLocation(currentLocation)
      } catch (err) {
        console.warn('Location access denied:', err)
      }

      // Use the live location for nearby search; fall back to india to show all stations across India.
      const region = currentLocation ? 'nearby' : 'india'
      const data = await stationService.getAllStations(
        currentLocation?.latitude || null,
        currentLocation?.longitude || null,
        region
      )
      setStations(data.stations || [])
    } catch (err) {
      setError(err.message || 'Failed to load stations')
    } finally {
      setLoading(false)
    }
  }

  const requestLocation = async () => {
    try {
      setError(null)
      // Stop previous watch if exists
      if (watchIdRef.current) watchIdRef.current()
      
      watchIdRef.current = watchLocation(async (location, err) => {
        if (err) {
          setError('Location tracking failed. ' + err.message)
          return
        }
        setUserLocation(location)
        try {
          const data = await stationService.getAllStations(location.latitude, location.longitude, 'nearby')
          setStations(data.stations || [])
        } catch (fetchErr) {
          console.error("Error fetching nearby stations: ", fetchErr)
        }
      })
    } catch (err) {
      setError('Location access was not available. Please allow location access and try again.')
    }
  }

  const mapMarkers = filteredStations.filter(
    (station) => Number.isFinite(Number(station.latitude)) && Number.isFinite(Number(station.longitude))
  )

  const filterAndSortStations = () => {
    let results = [...stations]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        (station) =>
          station.name.toLowerCase().includes(query) ||
          station.address.toLowerCase().includes(query)
      )
    }

    // Sort
    if (sortBy === 'distance' && userLocation) {
      results.sort((a, b) => {
        const distA = a.distance || 0
        const distB = b.distance || 0
        return distA - distB
      })
    } else if (sortBy === 'available') {
      results.sort((a, b) => {
        const availA = a.ports.filter(p => p.status === 'AVAILABLE').length
        const availB = b.ports.filter(p => p.status === 'AVAILABLE').length
        return availB - availA
      })
    } else if (sortBy === 'name') {
      results.sort((a, b) => a.name.localeCompare(b.name))
    }

    setFilteredStations(results)
  }

  const handleSearch = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    setSearchParams({ q: query })
  }

  if (loading) {
    return <Loading message="Loading stations..." />
  }

  return (
    <div className="page-section">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <h1>Charging Stations</h1>
          <p>Find and reserve your charging slot</p>
        </div>

        {error && <ErrorMessage title="Error" message={error} onClose={() => setError(null)} />}

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-box">
            <MapPin style={{ width: '20px', height: '20px' }} />
            <input
              type="text"
              placeholder="Search stations by name or address..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div className="filter-select">
            <Filter style={{ width: '18px', height: '18px' }} />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="distance">Sort by: Distance</option>
              <option value="available">Sort by: Available Ports</option>
              <option value="name">Sort by: Name</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
          Showing {filteredStations.length} station{filteredStations.length !== 1 ? 's' : ''}
        </div>

        <div className="map-panel">
          <div className="map-panel-header">
            <div>
              <h2>Charging stations near you</h2>
              <p>{userLocation ? 'Tracking your live location to show nearby stations.' : 'Allow location access to track and show nearby stations.'}</p>
            </div>
            <button type="button" className="btn btn-secondary btn-small" onClick={requestLocation}>
              <LocateFixed size={16} />
              Use my location
            </button>
          </div>
          <MapView markers={mapMarkers} userLocation={userLocation} />
        </div>

        {/* Stations Grid */}
        {filteredStations.length > 0 ? (
          <div className="stations-grid">
            {filteredStations.map((station) => (
              <StationCard key={station.id} station={station} />
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <MapPin style={{ width: '48px', height: '48px', opacity: 0.3 }} />
            <h3 style={{ marginTop: '1rem' }}>No Stations Found</h3>
            <p style={{ color: 'var(--text-tertiary)' }}>
              {searchQuery
                ? 'No stations match your search. Try different keywords.'
                : 'No stations available at the moment.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Stations