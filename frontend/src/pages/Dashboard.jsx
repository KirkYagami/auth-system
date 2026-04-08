import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/layout/Navbar'

const STAT_ICONS = {
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  shield: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  mail: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  key: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
}

export default function Dashboard() {
  const { user } = useAuth()

  const stats = [
    {
      icon: 'user',
      label: 'Account status',
      value: user?.is_active ? 'Active' : 'Inactive',
      accent: user?.is_active ? 'green' : 'red',
    },
    {
      icon: 'mail',
      label: 'Email verified',
      value: user?.is_verified ? 'Verified' : 'Unverified',
      accent: user?.is_verified ? 'green' : 'amber',
    },
    {
      icon: 'key',
      label: 'Two-factor auth',
      value: user?.is_2fa_enabled ? 'Enabled' : 'Disabled',
      accent: user?.is_2fa_enabled ? 'green' : 'neutral',
    },
    {
      icon: 'shield',
      label: 'Role',
      value: user?.role,
      accent: user?.role === 'ADMIN' ? 'indigo' : 'neutral',
    },
  ]

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-content">
        <div className="page-header">
          <div>
            <h2 className="page-title">
              Good to see you, {user?.first_name} 👋
            </h2>
            <p className="page-subtitle">{user?.email}</p>
          </div>
        </div>

        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className={`stat-card__icon accent--${stat.accent}`}>
                {STAT_ICONS[stat.icon]}
              </div>
              <div className="stat-card__body">
                <span className="stat-card__label">{stat.label}</span>
                <span className={`stat-card__value accent--${stat.accent}`}>{stat.value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="info-card">
          <h3 className="info-card__title">Account information</h3>
          <dl className="info-list">
            <div className="info-list__row">
              <dt>Full name</dt>
              <dd>{user?.first_name} {user?.last_name}</dd>
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
              <dt>2FA</dt>
              <dd>{user?.is_2fa_enabled ? 'Enabled' : 'Disabled'}</dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  )
}
