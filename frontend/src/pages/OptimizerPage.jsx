import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../services/firebase'
import { optimizeRoute } from '../services/cloudFunction'
import { useGoogleMaps } from '../hooks/useGoogleMaps'
import DestinationInput from '../components/DestinationInput'
import Map from '../components/Map'
import RouteResult from '../components/RouteResult'
import '../styles/optimizer.css'

export default function OptimizerPage() {
  const navigate    = useNavigate()
  const mapsLoaded  = useGoogleMaps()

  const [user,         setUser]         = useState(null)
  const [authChecked,  setAuthChecked]  = useState(false)
  const [destinations, setDestinations] = useState([])
  const [mode,         setMode]         = useState('closed')
  const [result,       setResult]       = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthChecked(true)
      if (!u) navigate('/login', { replace: true })
    })
  }, [navigate])

  const handleOptimize = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await optimizeRoute(destinations, mode)

      const withNames = data.orderedDestinations.map(d => ({
        ...d,
        name: destinations.find(
          src => src.lat === d.lat && src.lng === d.lng
        )?.name ?? '',
      }))

      setResult({ ...data, orderedDestinations: withNames })
    } catch (err) {
      setError(err.message || 'Failed to optimize route.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  if (!authChecked) return null

  const mapDestinations = result ? result.orderedDestinations : destinations

  return (
    <div className="opt-root">
      <header className="opt-header">
        <div className="opt-header-brand">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          Route Optimizer
        </div>
        <div className="opt-header-right">
          <span className="opt-header-email">{user?.email}</span>
          <button className="opt-header-logout" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <main className="opt-main">
        <aside className="opt-sidebar">
          <DestinationInput
            destinations={destinations}
            setDestinations={(d) => { setDestinations(d); setResult(null) }}
            mode={mode}
            setMode={setMode}
            onOptimize={handleOptimize}
            loading={loading}
            mapsLoaded={mapsLoaded}
          />

          {error && <div className="opt-submit-error">{error}</div>}

          <RouteResult result={result} />
        </aside>

        <section className="opt-map-section" aria-label="Route map">
          <Map destinations={mapDestinations} mapsLoaded={mapsLoaded} isOptimized={!!result} />
        </section>
      </main>
    </div>
  )
}
