import React, { useEffect, useRef } from 'react'

const DEFAULT_CENTER = { lat: 14.634, lng: -90.507 }

function clearMap(markersRef, rendererRef, polylineRef) {
  markersRef.current.forEach(m => m.setMap(null))
  markersRef.current = []
  if (rendererRef.current) { rendererRef.current.setMap(null); rendererRef.current = null }
  if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null }
}

export default function Map({ destinations, mapsLoaded, isOptimized }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const markersRef   = useRef([])
  const rendererRef  = useRef(null)
  const polylineRef  = useRef(null)

  useEffect(() => {
    if (!mapsLoaded || !containerRef.current || mapRef.current) return
    mapRef.current = new window.google.maps.Map(containerRef.current, {
      zoom: 8,
      center: DEFAULT_CENTER,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })
  }, [mapsLoaded])

  useEffect(() => {
    if (!mapRef.current) return

    clearMap(markersRef, rendererRef, polylineRef)

    if (!destinations?.length) return

    const bounds = new window.google.maps.LatLngBounds()

    destinations.forEach((dest, i) => {
      const marker = new window.google.maps.Marker({
        position: { lat: dest.lat, lng: dest.lng },
        map: mapRef.current,
        label: { text: String(i + 1), color: '#fff', fontWeight: 'bold', fontSize: '13px' },
        title: dest.name || `Stop ${i + 1}`,
      })
      markersRef.current.push(marker)
      bounds.extend({ lat: dest.lat, lng: dest.lng })
    })

    mapRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 })

    // Draw route by streets if optimized, straight line otherwise
    if (isOptimized && destinations.length >= 2) {
      const directionsService  = new window.google.maps.DirectionsService()
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map: mapRef.current,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#4E7EA6',
          strokeOpacity: 0.9,
          strokeWeight: 4,
        },
      })
      rendererRef.current = directionsRenderer

      const origin      = { lat: destinations[0].lat, lng: destinations[0].lng }
      const destination = { lat: destinations[destinations.length - 1].lat, lng: destinations[destinations.length - 1].lng }
      const waypoints   = destinations.slice(1, -1).map(d => ({
        location: { lat: d.lat, lng: d.lng },
        stopover: true,
      }))

      directionsService.route(
        {
          origin,
          destination,
          waypoints,
          travelMode: window.google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false,
        },
        (result, status) => {
          if (status === 'OK') {
            directionsRenderer.setDirections(result)
          }
          // On failure, markers already drawn — fallback is fine
        },
      )
    } else {
      polylineRef.current = new window.google.maps.Polyline({
        path: destinations.map(d => ({ lat: d.lat, lng: d.lng })),
        geodesic: true,
        strokeColor: '#4E7EA6',
        strokeOpacity: 0.6,
        strokeWeight: 2,
        map: mapRef.current,
      })
    }
  }, [destinations, isOptimized])

  return (
    <div className="opt-map-container">
      <div ref={containerRef} className="opt-map" />
      {!destinations?.length && (
        <div className="opt-map-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <p>Add destinations and optimize to see the route here</p>
        </div>
      )}
    </div>
  )
}
