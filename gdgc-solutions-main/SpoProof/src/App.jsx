// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import AppLayout from './components/AppLayout'
import DashboardPage from './pages/DashboardPage'
import VerifyPage from './pages/VerifyPage'
import ResultPage from './pages/ResultPage'
import ReportsPage from './pages/ReportsPage'
import CertificatesPage from './pages/CertificatesPage'
import AlertsPage from './pages/AlertsPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route path="/app" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="verify" element={<VerifyPage />} />
          <Route path="result" element={<ResultPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
