import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/auth'
import Input  from '../components/common/Input'
import Button from '../components/common/Button'
import Alert  from '../components/common/Alert'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
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
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="auth-card__title">Reset password</h1>
          <p className="auth-card__subtitle">
            {sent
              ? 'Check your email for a one-time code'
              : "Enter your email and we'll send you a reset code"}
          </p>
        </div>

        <Alert message={error} type="error" />

        {!sent ? (
          <form onSubmit={onSubmit} className="auth-form" noValidate>
            <Input
              label="Email address"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} className="btn--full">
              Send reset code
            </Button>
          </form>
        ) : (
          <div className="auth-success-state">
            <div className="status-icon status-icon--success">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <p>We've sent an OTP to <strong>{email}</strong></p>
            <Link to="/reset-password" className="btn btn--primary btn--full">
              Enter reset code
            </Link>
          </div>
        )}

        <p className="auth-card__footer">
          <Link to="/login">← Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
