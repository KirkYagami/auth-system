import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = user
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : ''

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/dashboard" className="navbar__brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          AuthEngine
        </Link>

        <nav className="navbar__nav">
          <Link to="/dashboard" className="navbar__link">Dashboard</Link>
          <Link to="/profile"   className="navbar__link">Profile</Link>
        </nav>

        <div className="navbar__actions">
          <span className="navbar__role">{user?.role}</span>
          {user?.profile_image_url ? (
            <img
              src={user.profile_image_url}
              alt="avatar"
              className="navbar__avatar"
            />
          ) : (
            <div className="navbar__avatar navbar__avatar--initials">{initials}</div>
          )}
          <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
