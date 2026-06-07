// src/pages/AuthCallbackPage.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { loginWithToken } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const error = params.get('error')

    if (error) {
      navigate(`/auth?error=${error}`)
      return
    }

    if (token) {
      loginWithToken(token)
      setTimeout(() => navigate('/app/dashboard'), 800)
    } else {
      navigate('/auth?error=missing_token')
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-0)', gap: 20,
    }}>
      <div style={{
        width: 48, height: 48, background: 'var(--accent)',
        borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ShieldCheck size={24} color="#fff" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div className="analysis-spinner" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>
          Signing you in to SpoProof...
        </p>
      </div>
    </div>
  )
}
