import React, { useState, useRef, useEffect } from 'react'

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const toRad = x => x * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function exceedsRadius(destinations) {
  for (let i = 0; i < destinations.length; i++) {
    for (let j = i + 1; j < destinations.length; j++) {
      const d = haversineKm(
        destinations[i].lat, destinations[i].lng,
        destinations[j].lat, destinations[j].lng,
      )
      if (d > 100) return true
    }
  }
  return false
}

export default function DestinationInput({
  destinations,
  setDestinations,
  mode,
  setMode,
  onOptimize,
  loading,
  mapsLoaded,
}) {
  const inputRef        = useRef(null)
  const autocompleteRef = useRef(null)
  const destsRef        = useRef(destinations)
  const [inputError, setInputError] = useState('')

  // Keep ref in sync so the autocomplete listener always sees the latest list
  useEffect(() => { destsRef.current = destinations }, [destinations])

  useEffect(() => {
    if (!mapsLoaded || !inputRef.current) return

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['geometry', 'formatted_address'],
    })

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace()
      if (!place?.geometry?.location) {
        setInputError('Select a place from the suggestions.')
        return
      }

      const newDest = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        name: place.formatted_address,
      }

      setInputError('')
      const current = destsRef.current

      if (current.length >= 15) {
        setInputError('Maximum 15 destinations allowed.')
        inputRef.current.value = ''
        return
      }

      const next = [...current, newDest]
      if (next.length >= 2 && exceedsRadius(next)) {
        setInputError(`"${newDest.name}" is more than 100 km from another destination.`)
        inputRef.current.value = ''
        return
      }

      setDestinations(next)
      inputRef.current.value = ''
    })
  }, [mapsLoaded])

  const remove = (i) => {
    setDestinations(destinations.filter((_, idx) => idx !== i))
    setInputError('')
  }

  const canOptimize = destinations.length >= 2 && !loading

  return (
    <>
      <h2 className="opt-panel-title">Destinations</h2>

      <div className="opt-field">
        <label className="opt-label" htmlFor="dest-search">Add destination</label>
        <input
          id="dest-search"
          ref={inputRef}
          className="opt-input"
          type="text"
          placeholder={mapsLoaded ? 'Search a place…' : 'Loading Maps…'}
          disabled={!mapsLoaded || destinations.length >= 15}
          autoComplete="off"
        />
        {inputError && <span className="opt-error">{inputError}</span>}
      </div>

      {destinations.length > 0 ? (
        <ol className="opt-dest-list">
          {destinations.map((d, i) => (
            <li key={i} className="opt-dest-item">
              <span className="opt-dest-num">{i + 1}</span>
              <span className="opt-dest-name">{d.name}</span>
              <button
                type="button"
                className="opt-dest-remove"
                onClick={() => remove(i)}
                aria-label={`Remove ${d.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="opt-hint">Add at least 2 destinations to optimize.</p>
      )}

      {destinations.length === 1 && (
        <p className="opt-hint">Add one more destination to continue.</p>
      )}

      <div className="opt-mode">
        <span className="opt-label">Route type</span>
        <div className="opt-mode-options">
          <label className="opt-radio">
            <input
              type="radio"
              name="route-mode"
              value="closed"
              checked={mode === 'closed'}
              onChange={() => setMode('closed')}
            />
            Closed (return to origin)
          </label>
          <label className="opt-radio">
            <input
              type="radio"
              name="route-mode"
              value="open"
              checked={mode === 'open'}
              onChange={() => setMode('open')}
            />
            Open (end at last stop)
          </label>
        </div>
      </div>

      <button
        className="opt-btn-primary"
        onClick={onOptimize}
        disabled={!canOptimize}
      >
        {loading ? 'Optimizing…' : 'Optimize Route'}
      </button>
    </>
  )
}
