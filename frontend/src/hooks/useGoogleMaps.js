import { useState, useEffect } from 'react'

export function useGoogleMaps() {
  const [loaded, setLoaded] = useState(() => !!window.google?.maps)

  useEffect(() => {
    if (window.google?.maps) { setLoaded(true); return }

    const existing = document.getElementById('gmap-script')
    if (existing) {
      existing.addEventListener('load', () => setLoaded(true))
      return
    }

    const script = document.createElement('script')
    script.id = 'gmap-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.onload = () => setLoaded(true)
    document.head.appendChild(script)
  }, [])

  return loaded
}
