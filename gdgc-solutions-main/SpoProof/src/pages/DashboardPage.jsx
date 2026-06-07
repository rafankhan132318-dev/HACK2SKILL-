// src/pages/DashboardPage.jsx
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { FileCheck, AlertTriangle, ShieldCheck, Coins, Upload, Play, TrendingUp, TrendingDown, Image, Video, FileText, Camera, RefreshCw } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

function StatusBadge({ status }) {
  const cls = status === 'Verified' ? 'badge-verified' : status === 'Suspicious' ? 'badge-suspicious' : 'badge-fake'
  return <span className={`badge ${cls}`}>{status}</span>
}

function getScoreClass(score) {
  return score >= 70 ? 'score-high' : score >= 40 ? 'score-medium' : 'score-low'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(() => {
    setLoading(true)
    api.getDashboard()
      .then(({ stats, recentActivity }) => { setStats(stats); setActivity(recentActivity) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchDashboard()
    // Refresh when window gets focus (e.g. returning from another tab)
    window.addEventListener('focus', fetchDashboard)
    return () => window.removeEventListener('focus', fetchDashboard)
  }, [fetchDashboard])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div className="analysis-spinner" />
    </div>
  )

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0] ?? 'there'} — here's your activity overview</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchDashboard} style={{ marginTop: 8 }}>
          <RefreshCw size={14} style={{ marginRight: 6 }} /> Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--accent-muted)', color: 'var(--accent-text)' }}>
            <FileCheck size={16} />
          </div>
          <div className="stat-card-value">{stats?.totalVerifications ?? 0}</div>
          <div className="stat-card-label">Total Verifications</div>
          <div className="stat-card-trend up"><TrendingUp size={11} /> +{stats?.trends?.verifications ?? 0}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--red-muted)', color: 'var(--red-text)' }}>
            <AlertTriangle size={16} />
          </div>
          <div className="stat-card-value">{stats?.fakeContentFound ?? 0}</div>
          <div className="stat-card-label">Fake Content Found</div>
          <div className="stat-card-trend down"><TrendingDown size={11} /> {stats?.trends?.fakeContent ?? 0}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--green-muted)', color: 'var(--green-text)' }}>
            <ShieldCheck size={16} />
          </div>
          <div className="stat-card-value">{stats?.avgTrustScore ?? 0}</div>
          <div className="stat-card-label">Avg Trust Score</div>
          <div className="stat-card-trend up"><TrendingUp size={11} /> +{stats?.trends?.trustScore ?? 0}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--blue-muted)', color: 'var(--blue)' }}>
            <Coins size={16} />
          </div>
          <div className="stat-card-value" style={{ color: user?.credits <= 3 ? 'var(--red-text)' : undefined }}>
            {stats?.credits ?? user?.credits ?? 0}
          </div>
          <div className="stat-card-label">Credits Remaining</div>
          {(stats?.credits ?? 0) <= 3 && (
            <div className="stat-card-trend down" style={{ color: 'var(--red-text)' }}>Low — use wisely</div>
          )}
        </div>
      </div>

      <div className="quick-actions">
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/app/verify')}>
          <Upload size={14} /> Upload File
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/app/verify')}>
          <Play size={14} /> Run Verification
        </button>
      </div>

      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 12 }}>Recent Activity</h3>

      {activity.length === 0 ? (
        <div className="empty-state">
          <FileCheck />
          <h3>No verifications yet</h3>
          <p>Upload your first file to get started</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>File Name</th><th>Type</th><th>Status</th><th>Score</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((item) => (
                <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/app/result', { state: { verificationId: item.id } })}>
                  <td style={{ color: 'var(--text-1)', fontWeight: 500, fontFamily: 'var(--mono)', fontSize: '12px' }}>{item.name}</td>
                  <td>{item.type}</td>
                  <td><StatusBadge status={item.status} /></td>
                  <td className={getScoreClass(item.score)} style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{item.score}%</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-4)' }}>{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
