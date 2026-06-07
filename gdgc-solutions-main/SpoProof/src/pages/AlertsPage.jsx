// src/pages/AlertsPage.jsx
import { useState, useEffect } from 'react'
import { AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import { api } from '../lib/api'

const trending = [
  { title: 'Premier League VAR controversy clips', count: '2.4K shares', risk: 'High' },
  { title: 'Champions League draw prediction leaks', count: '1.8K shares', risk: 'Medium' },
  { title: 'World Cup qualification fake lineups', count: '950 shares', risk: 'High' },
]

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAlerts().then(r => setAlerts(r.data ?? [])).catch(console.error).finally(() => setLoading(false))
  }, [])

  const markRead = async (id) => {
    await api.markAlertRead(id).catch(console.error)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Alerts</h1>
        <p className="page-subtitle">Live feed of suspicious and trending sports media</p>
      </div>
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="analysis-spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} style={{ color: 'var(--red)' }} /> Suspicious Content Feed
            </h3>
            {alerts.map((alert) => (
              <div key={alert.id} className="alert-card" style={{ opacity: alert.is_read ? 0.6 : 1 }} onClick={() => markRead(alert.id)}>
                <div className={`alert-card-indicator ${alert.severity}`} />
                <div className="alert-card-content">
                  <h4>{alert.title}</h4>
                  <p>{alert.description}</p>
                  <div className="alert-card-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {new Date(alert.created_at).toRelaleTimeString?.() ?? new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                    <span>Source: {alert.source}</span>
                    <span className={`badge badge-${alert.severity === 'high' ? 'fake' : alert.severity === 'medium' ? 'suspicious' : 'info'}`}>
                      {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)} Risk
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} style={{ color: 'var(--amber)' }} /> Trending Fake Media
            </h3>
            {trending.map((item, i) => (
              <div key={i} className="card" style={{ marginBottom: 12, padding: '16px 20px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 6 }}>{item.title}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item.count}</span>
                  <span className={`badge ${item.risk === 'High' ? 'badge-fake' : 'badge-suspicious'}`}>{item.risk}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
