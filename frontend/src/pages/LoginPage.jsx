import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from '../services/firebase'
import { authError } from '../utils/authErrors'
import '../styles/auth.css'
import {
  BrandLogo,
  EyeOpenIcon,
  EyeClosedIcon,
  GoogleIcon,
} from '../components/AuthIcons'

const googleProvider = new GoogleAuthProvider()

export default function LoginPage() {
  const navigate  = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})


  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.email.trim()) errs.email    = 'Required'
    if (!form.password)     errs.password = 'Required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password)
      navigate('/app')
    } catch (err) {
      const msg = authError(err.code)
      if (msg) setErrors({ submit: msg })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/app')
    } catch (err) {
      const msg = authError(err.code)
      if (msg) setErrors({ submit: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-left" aria-hidden="true">
          <div className="auth-left-logo">
            <BrandLogo />
          </div>
        </div>

        <div className="auth-right">
          <button
            type="button"
            className="auth-back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            ←
          </button>

          <div className="auth-form-wrap">
            <h1 className="auth-heading">Welcome back</h1>
            <p className="auth-sub">
              Don't have an account?{' '}
              <Link to="/signup">Sign up</Link>
            </p>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>

              <div className="auth-field">
                <label className="auth-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  className={`auth-input${errors.email ? ' auth-input--error' : ''}`}
                  type="email"
                  placeholder="Email Address"
                  autoComplete="email"
                  value={form.email}
                  onChange={set('email')}
                />
                {errors.email && <span className="auth-error-msg">{errors.email}</span>}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="password">Password</label>
                <div className="auth-password-wrap">
                  <input
                    id="password"
                    className={`auth-input${errors.password ? ' auth-input--error' : ''}`}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={set('password')}
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowPass(v => !v)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOpenIcon /> : <EyeClosedIcon />}
                  </button>
                </div>
                {errors.password && <span className="auth-error-msg">{errors.password}</span>}
              </div>

              <Link to="/reset-password" className="auth-forgot">
                Forgot password?
              </Link>

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              {errors.submit && <span className="auth-submit-error">{errors.submit}</span>}

              <div className="auth-or">or</div>

              <div className="auth-socials">
                <button type="button" className="auth-social-btn" onClick={handleGoogle} disabled={loading}>
                  <GoogleIcon /> Continue with Google
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
