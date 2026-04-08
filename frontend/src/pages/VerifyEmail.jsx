import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/auth'
import Spinner from '../components/common/Spinner'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found in the URL.')
      return
    }
    authApi.verifyEmail(token)
      .then(({ data }) => { setStatus('success'); setMessage(data.message) })
      .catch((err)    => {
        setStatus('error')
        setMessage(err.response?.data?.detail || 'Verification failed. The link may have expired.')
      })
  }, [token])

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--centered">
        {status === 'loading' && (
          <>
            <Spinner size="lg" />
            <p className="auth-card__subtitle" style={{ marginTop: '1rem' }}>Verifying your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="status-icon status-icon--success">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="auth-card__title">Email verified!</h1>
            <p className="auth-card__subtitle">{message}</p>
            <Link to="/login" className="btn btn--primary btn--full" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              Go to sign in
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="status-icon status-icon--error">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="auth-card__title">Verification failed</h1>
            <p className="auth-card__subtitle">{message}</p>
            <Link to="/login" className="btn btn--ghost btn--full" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
