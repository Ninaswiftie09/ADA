import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/landing.css'
import MapChart from '../components/MapChart'

const CAROUSEL_ITEMS = [
  { alt: 'Feature or photo one' },
  { alt: 'Feature or photo two' },
  { alt: 'Feature or photo three' },
]

function LandingNav() {
  return (
    <nav className="ld-nav" aria-label="Main navigation">
      <div className="ld-nav-inner">
        <Link to="/" className="ld-nav-brand" aria-label="Brand — home">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span>Route Optimizer</span>
        </Link>

        <div className="ld-nav-links">
          <Link to="/signup" className="ld-nav-cta">Get started</Link>
          <Link to="/login"  className="ld-nav-link">Sign in</Link>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="ld-hero" aria-label="Hero">
      <MapChart />
      <div className="ld-hero-overlay" aria-hidden="true" />

      <div className="ld-hero-content">
        <p className="ld-hero-eyebrow">Route Optimization · Genetic Algorithm</p>
        <h1 className="ld-hero-title">
          Smarter routes,<br />less time wasted
        </h1>
        <p className="ld-hero-sub">
          Find the optimal path through multiple stops using a genetic algorithm
          powered by Google Distance Matrix API.
        </p>
        <div className="ld-hero-actions">
          <Link to="/signup" className="ld-btn-primary">Get started free</Link>
          <Link to="/login"  className="ld-btn-ghost">Sign in →</Link>
        </div>
      </div>
    </section>
  )
}

function SectionDivider({ label }) {
  return (
    <div className="ld-divider" aria-hidden="true">
      <div className="ld-divider-inner">
        <div className="ld-divider-group">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
          </svg>
          {label && <span className="ld-divider-label">{label}</span>}
        </div>
        <div className="ld-divider-rule" />
        <div className="ld-divider-group">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          </svg>
        </div>
      </div>
    </div>
  )
}

function HorizontalCarousel() {
  const trackRef  = useRef(null)
  const idxRef    = useRef(0)
  const pausedRef = useRef(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const N = CAROUSEL_ITEMS.length

  const snapTo = (idx) => {
    idxRef.current = idx
    setActiveIdx(idx)
    const track = trackRef.current
    const item  = track?.children[idx]
    if (!item) return
    track.style.transform = `translateX(${-item.offsetLeft}px)`
  }

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    snapTo(0)
    const tick = setInterval(() => {
      if (!pausedRef.current) snapTo((idxRef.current + 1) % N)
    }, 3800)
    const onResize = () => snapTo(idxRef.current)
    window.addEventListener('resize', onResize)
    return () => { clearInterval(tick); window.removeEventListener('resize', onResize) }
  }, [])

  const goTo = (idx) => {
    idxRef.current = idx
    setActiveIdx(idx)
    const track = trackRef.current
    const item  = track?.children[idx]
    if (!item) return
    track.style.transform = `translateX(${-item.offsetLeft}px)`
  }

  return (
    <section className="ld-scroll-section" aria-label="Feature gallery">
      <div className="ld-scroll-sticky">
        <aside className="ld-scroll-copy">
          <p className="ld-scroll-label">01 — How it works</p>
          <h2 className="ld-scroll-heading">
            Optimize your<br />delivery routes.
          </h2>
          <p className="ld-scroll-desc">
            Enter your destinations, let the genetic algorithm compute the shortest
            path, and see the result rendered live on Google Maps.
          </p>
          <Link to="/signup" className="ld-scroll-cta">
            Try it free →
          </Link>
        </aside>

        <div
          className="ld-carousel-viewport"
          aria-label="Gallery"
          onMouseEnter={() => { pausedRef.current = true }}
          onMouseLeave={() => { pausedRef.current = false }}
        >
          <div className="ld-carousel-track" ref={trackRef}>
            {CAROUSEL_ITEMS.map((item, i) => (
              <figure
                key={i}
                className={`ld-carousel-item${i === activeIdx ? ' ld-carousel-item--active' : ''}`}
              >
                <div className="ld-carousel-placeholder">{item.alt}</div>
                <figcaption className="ld-carousel-num">
                  {String(activeIdx + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="ld-carousel-dots" role="tablist" aria-label="Gallery navigation">
            {CAROUSEL_ITEMS.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === activeIdx}
                aria-label={`Slide ${i + 1} of ${N}`}
                className={`ld-carousel-dot${i === activeIdx ? ' ld-carousel-dot--active' : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="ld-footer">
      <div className="ld-footer-inner">
        <div className="ld-footer-top">
          <div className="ld-footer-brand">
            <p className="ld-footer-name">Route Optimizer</p>
            <p className="ld-footer-tagline">
              Shortest path, every time — powered by genetic algorithms.
            </p>
          </div>

          <nav className="ld-footer-links" aria-label="Footer navigation">
            <Link to="/signup">Sign up</Link>
            <Link to="/login">Sign in</Link>
          </nav>
        </div>

        <div className="ld-footer-rule" aria-hidden="true" />

        <div className="ld-footer-bottom">
          <span>© {new Date().getFullYear()} Route Optimizer. All rights reserved.</span>
          <span>Built with Firebase + React + Google Maps</span>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="ld-root">
      <LandingNav />
      <Hero />
      <SectionDivider label="Verified process" />
      <HorizontalCarousel />
      <SectionDivider label="Ready to optimize" />
      <LandingFooter />
    </div>
  )
}
