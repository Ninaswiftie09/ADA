import { useLayoutEffect, useRef } from 'react'
import * as am5 from '@amcharts/amcharts5'
import * as am5map from '@amcharts/amcharts5/map'
import am5geodata_guatemalaLow from '@amcharts/amcharts5-geodata/guatemalaLow'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'

const GT = { lonMin: -92.23, lonMax: -88.22, latMin: 13.74, latMax: 17.82 }
const rndPt = () => [
  GT.lonMin + Math.random() * (GT.lonMax - GT.lonMin),
  GT.latMin + Math.random() * (GT.latMax - GT.latMin),
]

// Vehicle silhouette pointing right
const BULLET_PATH = 'M-12 0 L-8-7 L6-7 L14-3 L14 3 L6 7 L-8 7 Z'
const SCALE = 0.6
const DURATION = 4500

export default function MapChart() {
  const divRef = useRef(null)

  useLayoutEffect(() => {
    const root = am5.Root.new(divRef.current)
    root.setThemes([am5themes_Animated.new(root)])

    const chart = root.container.children.push(
      am5map.MapChart.new(root, {
        panX: 'translateX',
        panY: 'translateY',
        wheelY: 'zoom',
        projection: am5map.geoMercator(),
      })
    )

    chart.set('background', am5.Rectangle.new(root, {
      fill: am5.color('#0b111a'),
      fillOpacity: 1,
    }))

    // Guatemala polygons
    const polySeries = chart.series.push(
      am5map.MapPolygonSeries.new(root, { geoJSON: am5geodata_guatemalaLow })
    )
    polySeries.mapPolygons.template.setAll({
      fill: am5.color('#1F2A33'),
      stroke: am5.color('#4E7EA6'),
      strokeWidth: 0.8,
    })
    polySeries.mapPolygons.template.states.create('hover', {
      fill: am5.color('#263545'),
    })

    // Trajectory line
    const lineSeries = chart.series.push(am5map.MapLineSeries.new(root, {}))
    lineSeries.mapLines.template.setAll({
      stroke: am5.color('#8BBFE6'),
      strokeWidth: 1.5,
      strokeOpacity: 0.45,
      strokeDasharray: [6, 4],
    })
    lineSeries.data.push({ geometry: { type: 'LineString', coordinates: [] } })

    // Midpoint directional arrow
    const arrowSeries = chart.series.push(am5map.MapPointSeries.new(root, {}))
    arrowSeries.bullets.push(() =>
      am5.Bullet.new(root, {
        sprite: am5.Graphics.new(root, {
          svgPath: 'M-7-4 L7 0 L-7 4 Z',
          fill: am5.color('#8BBFE6'),
          fillOpacity: 0.9,
          scale: 0.85,
        }),
      })
    )
    arrowSeries.data.push({ geometry: { type: 'Point', coordinates: [-90.2, 15.8] } })

    // Waypoint markers — golden, draggable
    const wpSeries = chart.series.push(am5map.MapPointSeries.new(root, {}))
    wpSeries.bullets.push(() =>
      am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 7,
          fill: am5.color('#f5c518'),
          stroke: am5.color('#ffffff'),
          strokeWidth: 2,
          draggable: true,
          tooltipText: '¡Arrástrame!',
          cursorOverStyle: 'grab',
        }),
      })
    )

    // Vehicle bullet
    const motoSeries = chart.series.push(am5map.MapPointSeries.new(root, {}))
    motoSeries.bullets.push(() =>
      am5.Bullet.new(root, {
        sprite: am5.Graphics.new(root, {
          svgPath: BULLET_PATH,
          fill: am5.color('#C9E7FF'),
          fillOpacity: 0.95,
          scale: SCALE,
        }),
      })
    )

    // Seed initial waypoints
    const waypoints = Array.from({ length: 4 }, rndPt)
    wpSeries.data.setAll(
      waypoints.map((c, i) => ({
        id: `wp-${i}`,
        geometry: { type: 'Point', coordinates: c },
      }))
    )
    motoSeries.data.push({ geometry: { type: 'Point', coordinates: waypoints[0] } })

    let rafId = null
    let startTs = null
    let legFrom = waypoints[0]
    let legTo = waypoints[1]

    const setLine = (from, to) => {
      lineSeries.data.setIndex(0, {
        geometry: { type: 'LineString', coordinates: [from, to] },
      })
    }

    const tick = (ts) => {
      rafId = requestAnimationFrame(tick)

      const motoDI = motoSeries.dataItems[0]
      if (!motoDI) return

      if (startTs === null) startTs = ts
      const t = Math.min((ts - startTs) / DURATION, 1)

      const dx = legTo[0] - legFrom[0]
      const dy = legTo[1] - legFrom[1]
      const lon = legFrom[0] + dx * t
      const lat = legFrom[1] + dy * t

      // Position update
      motoSeries.data.setIndex(0, { geometry: { type: 'Point', coordinates: [lon, lat] } })

      // Rotation with horizontal flip when going left
      const goingRight = dx >= 0
      const rotation = goingRight
        ? Math.atan2(-dy, dx) * (180 / Math.PI)
        : Math.atan2(dy, -dx) * (180 / Math.PI)
      const sprite = motoDI.bullets?.[0]?.get('sprite')
      if (sprite) sprite.setAll({ rotation, scaleX: goingRight ? SCALE : -SCALE, scaleY: SCALE })

      // Arrow midpoint
      const arrowDI = arrowSeries.dataItems[0]
      if (arrowDI) {
        const mid = [(legFrom[0] + legTo[0]) / 2, (legFrom[1] + legTo[1]) / 2]
        arrowSeries.data.setIndex(0, { geometry: { type: 'Point', coordinates: mid } })
        const ang = Math.atan2(-dy, dx) * (180 / Math.PI)
        arrowDI.bullets?.[0]?.get('sprite')?.set('rotation', ang)
      }

      if (t >= 1) {
        legFrom = legTo
        const newPt = rndPt()
        waypoints.push(newPt)
        wpSeries.data.push({ geometry: { type: 'Point', coordinates: newPt } })
        legTo = newPt
        startTs = ts
        setLine(legFrom, legTo)
      }
    }

    setLine(legFrom, legTo)
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      root.dispose()
    }
  }, [])

  return (
    <div
      ref={divRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden="true"
    />
  )
}
