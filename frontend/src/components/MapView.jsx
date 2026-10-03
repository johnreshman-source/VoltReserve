import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './MapView.css'

const MapView = ({ 
  center = [77.2090, 28.6139], 
  zoom = 13, 
  markers = [],
  onMarkerClick = null,
  userLocation = null,
  style = {}
}) => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markersRef = useRef([])
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: center,
      zoom: zoom,
    })

    map.current.on('load', () => {
      setMapReady(true)
    })

    return () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !map.current) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Add user location marker
    if (userLocation) {
      const el = document.createElement('div')
      el.className = 'user-marker'
      el.style.width = '20px'
      el.style.height = '20px'
      el.style.background = 'rgba(111, 240, 160, 0.8)'
      el.style.border = '3px solid var(--primary)'
      el.style.borderRadius = '50%'
      el.style.cursor = 'pointer'

      const userMarker = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map.current)
      markersRef.current.push(userMarker)
    }

    // Add station markers
    markers.forEach((marker) => {
      const isExternal = marker.is_external !== false && marker.is_external !== undefined;
      const el = document.createElement('div')
      el.className = 'station-marker'
      el.style.width = isExternal ? '30px' : '36px'
      el.style.height = isExternal ? '30px' : '36px'
      el.style.background = isExternal ? '#3b82f6' : 'var(--primary)' // Blue for external, primary for ESP32
      el.style.border = isExternal ? '2px solid white' : '3px solid white'
      el.style.borderRadius = '50%'
      el.style.cursor = 'pointer'
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      el.style.fontSize = isExternal ? '14px' : '18px'
      el.textContent = isExternal ? '🔌' : '⚡'
      
      if (!isExternal) {
        el.style.boxShadow = '0 0 10px var(--primary)';
        el.style.zIndex = '10'; // Bring to front
      }

      el.addEventListener('click', () => {
        if (onMarkerClick) {
          onMarkerClick(marker)
        }
      })

      const popupContent = `
        <div style="padding: 10px; font-family: sans-serif; min-width: 150px;">
          ${!isExternal ? '<div style="background: var(--primary); color: #000; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 5px;">My ESP32 Station</div>' : '<div style="background: #3b82f6; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 5px;">OpenChargeMap</div>'}
          <h4 style="margin: 0 0 5px 0; font-size: 14px;">${marker.name}</h4>
          ${marker.operator ? `<p style="margin: 0 0 5px 0; font-size: 12px; color: #999;">Op: ${marker.operator}</p>` : ''}
          <p style="margin: 0; font-size: 12px; color: #aaa;">
            ${marker.distance ? `${marker.distance.toFixed(1)}km away` : 'Click for details'}
          </p>
        </div>
      `;

      const stationMarker = new maplibregl.Marker({ element: el })
        .setLngLat([marker.longitude, marker.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 })
            .setHTML(popupContent)
        )
        .addTo(map.current)
      markersRef.current.push(stationMarker)
    })

    const validMarkers = markers.filter(
      (marker) => Number.isFinite(Number(marker.longitude)) && Number.isFinite(Number(marker.latitude))
    )
    if (validMarkers.length > 1) {
      const bounds = new maplibregl.LngLatBounds()
      validMarkers.forEach((marker) => bounds.extend([marker.longitude, marker.latitude]))
      if (userLocation) bounds.extend([userLocation.longitude, userLocation.latitude])
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 700 })
    } else if (validMarkers.length === 1) {
      map.current.flyTo({ center: [validMarkers[0].longitude, validMarkers[0].latitude], zoom: 14 })
    }
  }, [mapReady, markers, userLocation, onMarkerClick])

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '12px',
        overflow: 'hidden',
        ...style,
      }}
    />
  )
}

export default MapView