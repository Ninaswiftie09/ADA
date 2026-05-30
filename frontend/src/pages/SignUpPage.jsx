import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
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

export default function SignUpPage() {
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [agreed,   setAgreed]   = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.firstName.trim())                      errs.firstName = 'Required'
    if (!form.lastName.trim())                        errs.lastName  = 'Required'
    if (!form.email.trim())                           errs.email     = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email))       errs.email     = 'Invalid email address'
    if (form.password.length < 6)                     errs.password  = 'Minimum 6 characters'
    if (!agreed)                                      errs.terms     = 'You must agree to continue'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)
      await updateProfile(cred.user, { displayName: `${form.firstName} ${form.lastName}` })
      await sendEmailVerification(cred.user)
      navigate('/login')
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
            <h1 className="auth-heading">Create an Account</h1>
            <p className="auth-sub">
              Already have an account?{' '}
              <Link to="/login">Log in</Link>
            </p>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>

              <div className="auth-row">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    className={`auth-input${errors.firstName ? ' auth-input--error' : ''}`}
                    type="text"
                    placeholder="John"
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={set('firstName')}
                  />
                  {errors.firstName && <span className="auth-error-msg">{errors.firstName}</span>}
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    className={`auth-input${errors.lastName ? ' auth-input--error' : ''}`}
                    type="text"
                    placeholder="Doe"
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={set('lastName')}
                  />
                  {errors.lastName && <span className="auth-error-msg">{errors.lastName}</span>}
                </div>
              </div>

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
                    autoComplete="new-password"
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

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>

              <label className="auth-terms">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                />
                I agree to the <Link to="/terms">Terms &amp; Condition</Link>
              </label>
              {errors.terms  && <span className="auth-error-msg">{errors.terms}</span>}
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
