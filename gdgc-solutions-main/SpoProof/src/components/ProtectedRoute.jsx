// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-0)',
      }}>
        <div className="analysis-spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />
  return children
}
