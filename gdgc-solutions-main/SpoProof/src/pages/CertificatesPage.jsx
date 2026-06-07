// src/pages/CertificatesPage.jsx
import { useState, useEffect } from 'react'
import { Award, Download, ExternalLink } from 'lucide-react'
import { api } from '../lib/api'

export default function CertificatesPage() {
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getCertificates().then(r => setCerts(r.data ?? [])).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleDownload = async (id, certId) => {
    try {
      const data = await api.downloadCertificate(id)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `${certId}.json`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { alert(e.message) }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Certificates</h1>
        <p className="page-subtitle">Ownership and authenticity certificates for verified assets</p>
      </div>
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="analysis-spinner" /></div>
        : certs.length === 0 ? (
          <div className="empty-state">
            <Award />
            <h3>No certificates yet</h3>
            <p>Verify media and generate certificates for authenticated content</p>
          </div>
        ) : certs.map((cert) => (
          <div key={cert.id} className="cert-card">
            <div className="cert-card-icon"><Award size={22} /></div>
            <div className="cert-card-info">
              <h4>{cert.asset}</h4>
              <div className="cert-card-meta">
                <span>ID: {cert.cert_id}</span>
                <span>Owner: {cert.owner}</span>
                <span>{new Date(cert.issued_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm"><ExternalLink size={14} /> View</button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(cert.id, cert.cert_id)}><Download size={14} /> Download</button>
            </div>
          </div>
        ))}
    </div>
  )
}
