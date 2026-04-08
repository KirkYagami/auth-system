import axios from 'axios'
import { tokenStore } from '../utils/token'

const client = axios.create({
  baseURL: '/auth',
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor ───────────────────────────────────────────────────────
// Attach the access token to every outgoing request
client.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor ──────────────────────────────────────────────────────
// On 401: attempt a token refresh, then retry the original request once.
// On refresh failure: clear tokens and redirect to login.
let isRefreshing = false
let pendingQueue = [] // requests waiting while refresh is in flight

const processPending = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  pendingQueue = []
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // No config = request never left the browser (network error / CORS abort).
    // Reject immediately so catch blocks in pages receive the error.
    if (!original) return Promise.reject(error)

    const is401          = error.response?.status === 401
    const alreadyRetried = original._retry
    const isRefreshCall  = original.url === '/refresh'

    if (!is401 || alreadyRetried || isRefreshCall) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      // Queue this request until the refresh completes
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`
        return client(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const refreshToken = tokenStore.getRefresh()
      if (!refreshToken) throw new Error('No refresh token')

      const { data } = await axios.post('/auth/refresh', {
        refresh_token: refreshToken,
      })

      tokenStore.setTokens(data.access_token, data.refresh_token)
      client.defaults.headers.common.Authorization = `Bearer ${data.access_token}`
      processPending(null, data.access_token)

      original.headers.Authorization = `Bearer ${data.access_token}`
      return client(original)
    } catch (refreshError) {
      processPending(refreshError)
      tokenStore.clearTokens()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default client
