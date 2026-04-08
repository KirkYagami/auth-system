// Re-export from context for cleaner import paths:
// import { useAuth } from '../hooks/useAuth'  ← from pages/components
// import { useAuth } from '../../hooks/useAuth' ← from nested components
export { useAuth } from '../context/AuthContext'
