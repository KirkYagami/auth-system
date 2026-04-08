import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/auth'
import { tokenStore } from '../utils/token'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true) // true on first mount while we rehydrate

  // ── Rehydrate session on page load ─────────────────────────────────────────
  useEffect(() => {
    const rehydrate = async () => {
      if (!tokenStore.hasAccess()) {
        setLoading(false)
        return
      }
      try {
        const { data } = await authApi.getMe()
        setUser(data)
      } catch {
        // Access token invalid/expired and refresh also failed → clear
        tokenStore.clearTokens()
      } finally {
        setLoading(false)
      }
    }
    rehydrate()
  }, [])

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password })

    // Backend returns either tokens (2FA off) or a message (2FA on)
    if (data.access_token) {
      tokenStore.setTokens(data.access_token, data.refresh_token)
      const me = await authApi.getMe()
      setUser(me.data)
      return { requires2FA: false }
    }

    // 2FA required — caller handles the redirect
    return { requires2FA: true, email }
  }, [])

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      const refresh = tokenStore.getRefresh()
      if (refresh) await authApi.logout(refresh)
    } catch {
      // Swallow — we clear locally regardless
    } finally {
      tokenStore.clearTokens()
      setUser(null)
    }
  }, [])

  // ── Post-2FA login ─────────────────────────────────────────────────────────
  const finaliseLogin = useCallback(async (accessToken, refreshToken) => {
    tokenStore.setTokens(accessToken, refreshToken)
    const { data } = await authApi.getMe()
    setUser(data)
  }, [])

  // ── Refresh user object (e.g. after profile image upload) ─────────────────
  const refreshUser = useCallback(async () => {
    const { data } = await authApi.getMe()
    setUser(data)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, finaliseLogin, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
