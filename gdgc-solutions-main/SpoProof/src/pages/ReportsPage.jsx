// src/pages/ReportsPage.jsx
import { useState, useEffect } from 'react'
import { Image, Video, FileText, Camera, Download } from 'lucide-react'
import { api } from '../lib/api'

function getStatusBadge(status) {
  const cls = status === 'Verified' ? 'badge-verified' : status === 'Suspicious' ? 'badge-suspicious' : 'badge-fake'
  return <span className={`badge ${cls}`}>{status}</span>
}
function getScoreClass(score) { return score >= 70 ? 'score-high' : score >= 40 ? 'score-medium' : 'score-low' }
function getTypeIcon(type) {
  switch(type) {
    case 'Video': return <Video size={14} />; case 'Image': return <Image size={14} />
    case 'Screenshot': return <Camera size={14} />; default: return <FileText size={14} />
  }
}

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.getReports({ status: statusFilter !== 'All' ? statusFilter : undefined, search: search || undefined })
      .then(r => setReports(r.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [statusFilter, search])

  const handleDownload = async (id) => {
    try {
      const report = await api.downloadReport(id)
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `report-${id}.json`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { alert(e.message) }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">All verification reports in one place</p>
      </div>
      <div className="filter-bar">
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          <option value="Verified">Verified</option>
          <option value="Suspicious">Suspicious</option>
          <option value="Fake">Fake</option>
        </select>
        <input className="filter-search" placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="analysis-spinner" /></div> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>File</th><th>Type</th><th>Status</th><th>Score</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.file}</td>
                  <td><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{getTypeIcon(r.type)} {r.type}</span></td>
                  <td>{getStatusBadge(r.status)}</td>
                  <td className={getScoreClass(r.score)} style={{ fontWeight: 600 }}>{r.score}%</td>
                  <td>{r.date}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => handleDownload(r.id)}><Download size={12} /></button></td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No reports found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
