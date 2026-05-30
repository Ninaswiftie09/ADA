import React from 'react'

export default function RouteResult({ result }) {
  if (!result) return null

  return (
    <div className="opt-result">
      <div className="opt-result-stat">
        <span className="opt-result-label">Total distance</span>
        <span className="opt-result-value">{result.totalDistanceKm} km</span>
      </div>
      <div className="opt-result-stat">
        <span className="opt-result-label">Mode</span>
        <span className="opt-result-value">
          {result.mode === 'closed' ? 'Closed loop' : 'Open route'}
        </span>
      </div>

      <ol className="opt-result-list">
        {result.orderedDestinations.map((d, i) => (
          <li key={i} className="opt-result-item">
            <span className="opt-result-num">{i + 1}</span>
            <span>{d.name || `${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}`}</span>
          </li>
        ))}
        {result.mode === 'closed' && result.orderedDestinations.length > 0 && (
          <li className="opt-result-item opt-result-item--return">
            <span className="opt-result-num">↩</span>
            <span>
              {result.orderedDestinations[0].name || 'Return to origin'}
            </span>
          </li>
        )}
      </ol>
    </div>
  )
}
