import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'

import Login          from '../pages/Login'
import Register       from '../pages/Register'
import VerifyEmail    from '../pages/VerifyEmail'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword  from '../pages/ResetPassword'
import Verify2FA      from '../pages/Verify2FA'
import Dashboard      from '../pages/Dashboard'
import Profile        from '../pages/Profile'

export default function AppRouter() {
  return (
    <Routes>
      {/* ── Public routes (redirect to /dashboard if already logged in) ────── */}
      <Route element={<PublicRoute />}>
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/verify-2fa"      element={<Verify2FA />} />
      </Route>

      {/* ── Open routes (no auth check) ────────────────────────────────────── */}
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* ── Protected routes (redirect to /login if not authenticated) ─────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile"   element={<Profile />} />
      </Route>

      {/* ── Fallback ───────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
