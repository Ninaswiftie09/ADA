import { useLayoutEffect, useRef } from 'react'
import * as am5 from '@amcharts/amcharts5'
import * as am5map from '@amcharts/amcharts5/map'
import am5geodata_guatemalaLow from '@amcharts/amcharts5-geodata/guatemalaLow'
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated'

const GT_CITIES = [
  { lat: 14.6349, lon: -90.5328 },
  { lat: 14.8453, lon: -91.5222 },
  { lat: 14.3047, lon: -90.7869 },
  { lat: 15.4689, lon: -90.3662 },
  { lat: 15.3192, lon: -91.4769 },
  { lat: 14.7989, lon: -89.5397 },
  { lat: 14.9711, lon: -89.5297 },
  { lat: 15.7289, lon: -88.5943 },
  { lat: 16.9334, lon: -89.8936 },
  { lat: 14.5317, lon: -91.6800 },
  { lat: 14.5325, lon: -91.5028 },
  { lat: 15.8000, lon: -90.2000 },
  { lat: 14.7000, lon: -91.1500 },
  { lat: 14.5500, lon: -90.7000 },
  { lat: 15.3000, lon: -89.3500 },
]

const INITIAL_WAYPOINTS = 4
const MAX_WAYPOINTS = 6
const LEG_MS = 4000

const CAR_PATH =
  'M16,6l3,4h2c1.11,0,2,0.89,2,2v3h-2c0,1.66-1.34,3-3,3s-3-1.34-3-3H9' +
  'c0,1.66-1.34,3-3,3s-3-1.34-3-3H1v-3c0-1.11,0.89-2,2-2l3-4H16' +
  'M10.5,7.5H6.75L4.86,10h5.64V7.5' +
  'M12,7.5V10h5.14l-1.89-2.5H12' +
  'M6,13.5c-0.83,0-1.5,0.67-1.5,1.5s0.67,1.5,1.5,1.5s1.5-0.67,1.5-1.5S6.83,13.5,6,13.5' +
  'M18,13.5c-0.83,0-1.5,0.67-1.5,1.5s0.67,1.5,1.5,1.5s1.5-0.67,1.5-1.5S18.83,13.5,18,13.5z'
const CAR_SCALE = 1.6

function pickCity() {
  const c = GT_CITIES[Math.floor(Math.random() * GT_CITIES.length)]
  const spread = 0.2 // ~22 km max offset
  return {
    lat: c.lat + (Math.random() - 0.5) * spread,
    lon: c.lon + (Math.random() - 0.5) * spread,
  }
}

export default function MapChart() {
  const divRef = useRef(null)

  useLayoutEffect(() => {
    // ── Root & chart ──────────────────────────────────────────────────────────
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
    chart.set('zoomControl', am5map.ZoomControl.new(root, {}))

    // ── Guatemala polygons ────────────────────────────────────────────────────
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

    // ── Single line series (multiple data items, one per leg) ─────────────────
    const lineSeries = chart.series.push(am5map.MapLineSeries.new(root, {}))
    lineSeries.mapLines.template.setAll({
      stroke: am5.color('#8BBFE6'),
      strokeWidth: 1.5,
      strokeOpacity: 0.4,
      strokeDasharray: [6, 4],
    })

    // ── Waypoint markers (golden, draggable) ──────────────────────────────────
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

    // ── Car series — one bullet per data item, all initially hidden ──────────
    const carSeries = chart.series.push(am5map.MapPointSeries.new(root, {}))
    carSeries.bullets.push(() =>
      am5.Bullet.new(root, {
        sprite: am5.Graphics.new(root, {
          svgPath: CAR_PATH,
          fill: am5.color('#C9E7FF'),
          fillOpacity: 1,
          scale: CAR_SCALE,
          centerX: am5.percent(50),
          centerY: am5.percent(50),
          forceHidden: true,
        }),
      })
    )

    // ── State ─────────────────────────────────────────────────────────────────
    let waypoints = Array.from({ length: INITIAL_WAYPOINTS }, pickCity)
    let wpDIs = []   // wpSeries data items
    let segDIs = []  // lineSeries data items (one per leg)
    let carDIs = []  // carSeries data items (one per leg, dedicated lineDataItem)
    let legIdx = 0
    let fwd = true

    // ── Helpers ───────────────────────────────────────────────────────────────
    function createWaypointDI(c) {
      return wpSeries.pushDataItem({ latitude: c.lat, longitude: c.lon })
    }

    function createSegmentDI(wpA, wpB) {
      return lineSeries.pushDataItem({ pointsToConnect: [wpA, wpB] })
    }

    function createCarDI(segDI) {
      return carSeries.pushDataItem({
        lineDataItem: segDI,
        positionOnLine: 0,
        autoRotate: true,
        autoRotateAngle: 0,
      })
    }

    function setCarVisible(idx, visible) {
      const car = carDIs[idx]
      if (!car) return
      const sprite = car.bullets?.[0]?.get('sprite')
      if (sprite) {
        sprite.set('forceHidden', !visible)
      } else if (visible) {
        // Bullet not yet rendered — try again next frame
        root.events.once('frameended', () => setCarVisible(idx, visible))
      }
    }

    function hideAllCars() {
      for (let i = 0; i < carDIs.length; i++) {
        const sprite = carDIs[i].bullets?.[0]?.get('sprite')
        if (sprite) sprite.set('forceHidden', true)
      }
    }

    // ── Animation loop ────────────────────────────────────────────────────────
    function startLeg() {
      const car = carDIs[legIdx]
      if (!car) {
        root.events.once('frameended', startLeg)
        return
      }

      hideAllCars()

      // Direction: forward = face start→end (0°), backward = face end→start (180°)
      car.set('autoRotateAngle', fwd ? 0 : 180)
      car.set('positionOnLine', fwd ? 0 : 1)

      // Defer one frame so the bullet sprite is ready before showing
      root.events.once('frameended', () => {
        setCarVisible(legIdx, true)

        const anim = car.animate({
          key: 'positionOnLine',
          from: fwd ? 0 : 1,
          to: fwd ? 1 : 0,
          duration: LEG_MS,
          easing: am5.ease.inOut(am5.ease.cubic),
        })

        if (anim) {
          anim.events.on('stopped', onLegDone)
        } else {
          // animate() returned null — fall through to next leg
          setTimeout(onLegDone, 50)
        }
      })
    }

    function onLegDone() {
      if (fwd) {
        if (legIdx + 1 >= segDIs.length) {
          // End of forward — reverse direction, stay on last leg
          fwd = false
        } else {
          legIdx++
        }
      } else {
        if (legIdx === 0) {
          // Reached start of backward — add waypoint if room, then go forward
          if (waypoints.length < MAX_WAYPOINTS) {
            const newCity = pickCity()
            waypoints.push(newCity)

            const newWp = createWaypointDI(newCity)
            wpDIs.push(newWp)

            const newSeg = createSegmentDI(wpDIs[wpDIs.length - 2], newWp)
            segDIs.push(newSeg)

            const newCar = createCarDI(newSeg)
            carDIs.push(newCar)
          }
          fwd = true
          // Give amCharts a frame to validate any newly-added data items
          root.events.once('frameended', startLeg)
          return
        } else {
          legIdx--
        }
      }
      startLeg()
    }

    // ── Initialize data items ─────────────────────────────────────────────────
    waypoints.forEach(c => wpDIs.push(createWaypointDI(c)))
    for (let i = 0; i < wpDIs.length - 1; i++) {
      segDIs.push(createSegmentDI(wpDIs[i], wpDIs[i + 1]))
    }
    for (let i = 0; i < segDIs.length; i++) {
      carDIs.push(createCarDI(segDIs[i]))
    }

    // ── Kick off when the polygon series finishes loading ────────────────────
    polySeries.events.on('datavalidated', () => {
      root.events.once('frameended', () => {
        setTimeout(startLeg, 400)
      })
    })

    return () => root.dispose()
  }, [])

  return (
    <div
      ref={divRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden="true"
    />
  )
}
