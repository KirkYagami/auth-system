const ACCESS_KEY  = 'ae_access'
const REFRESH_KEY = 'ae_refresh'

export const tokenStore = {
  getAccess:      () => localStorage.getItem(ACCESS_KEY),
  getRefresh:     () => localStorage.getItem(REFRESH_KEY),
  setTokens:      (access, refresh) => {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  },
  clearTokens:    () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
  hasAccess:      () => !!localStorage.getItem(ACCESS_KEY),
}
