import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../hooks/useAuth'
import Input  from '../components/common/Input'
import Button from '../components/common/Button'
import Alert  from '../components/common/Alert'

export default function Verify2FA() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { finaliseLogin } = useAuth()

  const email = location.state?.email
  const [otp,     setOtp]     = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  if (!email) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--centered">
          <p>No session found. <Link to="/login">Go back to login.</Link></p>
        </div>
      </div>
    )
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.verify2FA(email, otp)
      await finaliseLogin(data.access_token, data.refresh_token)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <div className="auth-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="auth-card__title">Two-factor auth</h1>
          <p className="auth-card__subtitle">
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>
        </div>

        <Alert message={error} type="error" />

        <form onSubmit={onSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="otp" className="form-label">One-time code</label>
            <input
              id="otp"
              className="form-input otp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="• • • • • •"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              autoFocus
              required
            />
          </div>

          <Button type="submit" loading={loading} className="btn--full">
            Verify
          </Button>
        </form>

        <p className="auth-card__footer">
          <Link to="/login">← Use a different account</Link>
        </p>
      </div>
    </div>
  )
}
