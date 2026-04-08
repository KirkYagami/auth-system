import { useRef, useState } from 'react'
import { authApi } from '../api/auth'
import { useAuth } from '../hooks/useAuth'
import Navbar  from '../components/layout/Navbar'
import Button  from '../components/common/Button'
import Alert   from '../components/common/Alert'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const fileRef = useRef()

  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError,   setUploadError]   = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  const [twoFaLoading,  setTwoFaLoading]  = useState(false)
  const [twoFaError,    setTwoFaError]    = useState('')
  const [twoFaSuccess,  setTwoFaSuccess]  = useState('')

  const [preview, setPreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  // ── Image selection ────────────────────────────────────────────────────────
  const onFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    setUploadError('')
    setUploadSuccess('')
  }

  // ── Image upload ───────────────────────────────────────────────────────────
  const onUpload = async () => {
    if (!selectedFile) return
    setUploadError('')
    setUploadSuccess('')
    setUploadLoading(true)
    try {
      await authApi.uploadProfileImage(selectedFile)
      await refreshUser()
      setUploadSuccess('Profile picture updated.')
      setSelectedFile(null)
      setPreview(null)
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Upload failed.')
    } finally {
      setUploadLoading(false)
    }
  }

  // ── Toggle 2FA ─────────────────────────────────────────────────────────────
  const toggle2FA = async () => {
    setTwoFaError('')
    setTwoFaSuccess('')
    setTwoFaLoading(true)
    try {
      await authApi.enable2FA(!user.is_2fa_enabled)
      await refreshUser()
      setTwoFaSuccess(`Two-factor authentication ${!user.is_2fa_enabled ? 'enabled' : 'disabled'}.`)
    } catch (err) {
      setTwoFaError(err.response?.data?.detail || 'Could not update 2FA setting.')
    } finally {
      setTwoFaLoading(false)
    }
  }

  const displayImage = preview || user?.profile_image_url
  const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : ''

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-content">
        <div className="page-header">
          <h2 className="page-title">Profile</h2>
          <p className="page-subtitle">Manage your account settings</p>
        </div>

        {/* ── Profile picture ─────────────────────────────────────────────── */}
        <div className="profile-card">
          <h3 className="profile-card__title">Profile picture</h3>
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {displayImage ? (
                <img src={displayImage} alt="Profile" />
              ) : (
                <span className="profile-avatar__initials">{initials}</span>
              )}
              <button
                className="profile-avatar__edit"
                onClick={() => fileRef.current?.click()}
                title="Change photo"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>

            <div className="profile-avatar-meta">
              <p className="profile-avatar-meta__name">{user?.first_name} {user?.last_name}</p>
              <p className="profile-avatar-meta__email">{user?.email}</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={onFileChange}
              />
              {selectedFile && (
                <p className="profile-avatar-meta__filename">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>

          <Alert message={uploadError}   type="error" />
          <Alert message={uploadSuccess} type="success" />

          {selectedFile && (
            <div className="profile-card__actions">
              <Button
                onClick={onUpload}
                loading={uploadLoading}
                variant="primary"
              >
                Upload photo
              </Button>
              <Button
                onClick={() => { setSelectedFile(null); setPreview(null) }}
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* ── Account details ─────────────────────────────────────────────── */}
        <div className="profile-card">
          <h3 className="profile-card__title">Account details</h3>
          <dl className="info-list">
            <div className="info-list__row">
              <dt>First name</dt>
              <dd>{user?.first_name}</dd>
            </div>
            <div className="info-list__row">
              <dt>Last name</dt>
              <dd>{user?.last_name}</dd>
            </div>
            <div className="info-list__row">
              <dt>Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div className="info-list__row">
              <dt>Role</dt>
              <dd><span className={`badge badge--${user?.role?.toLowerCase()}`}>{user?.role}</span></dd>
            </div>
            <div className="info-list__row">
              <dt>Account status</dt>
              <dd>
                <span className={`badge badge--${user?.is_active ? 'active' : 'inactive'}`}>
                  {user?.is_active ? 'Active' : 'Inactive'}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* ── Security ────────────────────────────────────────────────────── */}
        <div className="profile-card">
          <h3 className="profile-card__title">Security</h3>

          <Alert message={twoFaError}   type="error" />
          <Alert message={twoFaSuccess} type="success" />

          <div className="security-row">
            <div className="security-row__info">
              <p className="security-row__label">Two-factor authentication</p>
              <p className="security-row__description">
                Require an email OTP in addition to your password when signing in.
              </p>
            </div>
            <div className="security-row__action">
              <div className={`toggle ${user?.is_2fa_enabled ? 'toggle--on' : ''}`}>
                <span className="toggle__label">
                  {user?.is_2fa_enabled ? 'On' : 'Off'}
                </span>
              </div>
              <Button
                onClick={toggle2FA}
                loading={twoFaLoading}
                variant={user?.is_2fa_enabled ? 'danger' : 'primary'}
                className="btn--sm"
              >
                {user?.is_2fa_enabled ? 'Disable 2FA' : 'Enable 2FA'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
