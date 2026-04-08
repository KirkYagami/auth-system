import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import Input  from '../components/common/Input'
import Button from '../components/common/Button'
import Alert  from '../components/common/Alert'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ token: '', new_password: '', confirm: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.new_password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword(form.token, form.new_password)
      navigate('/login', { state: { message: 'Password reset successfully. Please sign in.' } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed. The code may have expired.')
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
          <h1 className="auth-card__title">Set new password</h1>
          <p className="auth-card__subtitle">Enter the OTP from your email and your new password</p>
        </div>

        <Alert message={error} type="error" />

        <form onSubmit={onSubmit} className="auth-form" noValidate>
          <Input
            label="One-time code"
            id="token"
            name="token"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            value={form.token}
            onChange={onChange}
            required
          />
          <Input
            label="New password"
            id="new_password"
            name="new_password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            value={form.new_password}
            onChange={onChange}
            required
          />
          <Input
            label="Confirm new password"
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={onChange}
            required
          />
          <Button type="submit" loading={loading} className="btn--full">
            Reset password
          </Button>
        </form>

        <p className="auth-card__footer">
          <Link to="/forgot-password">← Resend code</Link>
        </p>
      </div>
    </div>
  )
}
