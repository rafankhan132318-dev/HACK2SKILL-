// src/pages/ResultPage.jsx
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { ShieldCheck, AlertTriangle, XCircle, Download, Award, RefreshCw, CheckCircle, MessageSquare, Send, X, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const statusConfigs = {
  Verified:   { icon: CheckCircle,   label: 'Verified',   desc: 'This media appears to be authentic and unaltered.',           color: 'var(--green)',   cssClass: 'verified' },
  Suspicious: { icon: AlertTriangle, label: 'Suspicious', desc: 'Some anomalies detected. Further review recommended.',         color: 'var(--amber)',   cssClass: 'suspicious' },
  Fake:       { icon: XCircle,       label: 'Fake',       desc: 'This media has been significantly altered or fabricated.',     color: 'var(--red)',     cssClass: 'fake' },
}

function SignalRow({ label, value, verdict }) {
  const color = verdict === 'verified' || verdict === 'likely_authentic' || verdict === 'match_authentic' || verdict === 'confirmed' || verdict === 'original_found'
    ? 'var(--green-text)' : verdict === 'unknown' || verdict === 'no_match' || verdict === 'unconfirmed' || verdict === 'no_results'
    ? 'var(--amber-text)' : 'var(--red-text)'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--border-1)' }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)', flex: 1 }}>{label}</span>
      <span style={{ fontSize: 'var(--text-xs)', color, fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>{value}</span>
    </div>
  )
}

export default function ResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, updateUser } = useAuth()

  const result = location.state?.result
  const [data, setData] = useState(result ?? null)
  const [loading, setLoading] = useState(!result)

  // Gemini chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'model', content: `Hi! I've analyzed this media. Ask me anything about the verification result — source credibility, deepfake signals, what the trust score means, or what you should do next.` }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [signalsOpen, setSignalsOpen] = useState(false)
  const chatEndRef = useRef(null)

  // Load by ID if navigated from dashboard
  useEffect(() => {
    const id = location.state?.verificationId
    if (id && !result) {
      api.getVerification(id).then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="analysis-spinner" /></div>
  if (!data) return (
    <div className="empty-state">
      <ShieldCheck />
      <h3>No result found</h3>
      <p><a href="/app/verify" style={{ color: 'var(--accent-text)' }}>Run a verification first</a></p>
    </div>
  )

  const config = statusConfigs[data.status] ?? statusConfigs.Suspicious
  const StatusIcon = config.icon
  const m = data.metrics ?? {}
  const s = data.signals ?? {}

  const handleDownload = async () => {
    try {
      const report = await api.downloadReport(data.id)
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `spoproof-${data.id}.json`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { alert('Download failed: ' + e.message) }
  }

  const handleCertificate = async () => {
    if (data.status !== 'Verified') { alert('Certificates can only be issued for Verified media.'); return }
    try {
      await api.generateCertificate(data.id)
      alert('Certificate generated! View it in the Certificates section.')
      navigate('/app/certificates')
    } catch (e) { alert('Certificate generation failed: ' + e.message) }
  }

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = { role: 'user', content: chatInput.trim() }
    setMessages(prev => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)
    try {
      const history = messages.slice(1) // exclude initial greeting
      const { reply, creditsRemaining } = await api.geminiChat(data.id, userMsg.content, history)
      setMessages(prev => [...prev, { role: 'model', content: reply }])
      if (creditsRemaining !== undefined) updateUser({ credits: creditsRemaining })
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', content: e.status === 402 ? '⚠️ Not enough credits for Gemini chat.' : `Sorry, I encountered an error: ${e.message}` }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Verification Result</h1>
        <p className="page-subtitle">Analysis complete — {data.fileName ?? data.submittedUrl ?? 'media'}</p>
      </div>

      {/* Status card */}
      <div className={`result-status ${config.cssClass}`}>
        <div className="result-status-icon"><StatusIcon size={40} /></div>
        <h2 style={{ color: config.color }}>{config.label}</h2>
        <p>{data.recommendation ?? config.desc}</p>
        <div style={{ marginTop: 12, fontSize: 'var(--text-xs)', color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>
          Trust Score: <strong style={{ color: config.color, fontSize: 'var(--text-base)' }}>{data.trustScore}/100</strong>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics-grid">
        {[
          { label: 'Authenticity Score', value: `${m.authenticity ?? 0}%`, score: m.authenticity },
          { label: 'Source Match', value: `${m.sourceMatch ?? 0}%`, score: m.sourceMatch },
          { label: 'Tamper Risk', value: `${m.tamperRisk ?? 0}%`, score: 100 - (m.tamperRisk ?? 0), invert: true },
          { label: 'Metadata Status', value: m.metadataStatus ?? 'Unknown', isText: true, textColor: m.metadataStatus === 'Clean' ? 'var(--green)' : m.metadataStatus === 'Partial' ? 'var(--amber)' : 'var(--red)' },
          { label: 'AI Probability', value: `${m.aiProbability ?? 0}%`, score: 100 - (m.aiProbability ?? 0), invert: true },
        ].map(({ label, value, score, isText, textColor }) => (
          <div key={label} className="metric-card">
            <div className="metric-card-value" style={{
              color: isText ? textColor : score >= 70 ? 'var(--success, var(--green))' : score >= 40 ? 'var(--amber)' : 'var(--red)',
            }}>
              {value}
            </div>
            <div className="metric-card-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Signal breakdown (collapsible) */}
      <div className="card" style={{ marginBottom: 16 }}>
        <button
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          onClick={() => setSignalsOpen(!signalsOpen)}
        >
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-1)' }}>Signal Breakdown</span>
          {signalsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {signalsOpen && (
          <div style={{ marginTop: 12 }}>
            {s.source && <SignalRow label="Source Credibility" value={s.source.reason} verdict={s.source.verdict} />}
            {s.hash && <SignalRow label="Content Hash" value={s.hash.reason} verdict={s.hash.verdict} />}
            {s.metadata && <SignalRow label="Metadata Analysis" value={s.metadata.reason} verdict={s.metadata.verdict} />}
            {s.deepfake && <SignalRow label="Deepfake / AI Detection" value={s.deepfake.reason} verdict={s.deepfake.verdict} />}
            {s.reverseImage && <SignalRow label="Reverse Image Search" value={`${s.reverseImage.reason} (${s.reverseImage.matchCount} matches)`} verdict={s.reverseImage.verdict} />}
            {s.factCheck && <SignalRow label="Sports Fact Check" value={s.factCheck.reason} verdict={s.factCheck.verdict} />}
            {s.factCheck?.relatedArticles?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Related Articles</p>
                {s.factCheck.relatedArticles.slice(0, 3).map((a, i) => (
                  <a key={i} href={a.url} target="_blank" rel="noreferrer"
                    style={{ display: 'block', padding: '8px 0', borderBottom: '1px solid var(--border-1)', fontSize: 'var(--text-xs)' }}>
                    <span style={{ color: 'var(--accent-text)', fontWeight: 500 }}>{a.source}</span>
                    <span style={{ color: 'var(--text-2)', marginLeft: 8 }}>{a.title}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="result-actions" style={{ marginBottom: 24 }}>
        <button className="btn btn-secondary" onClick={handleDownload}><Download size={16} /> Download Report</button>
        {data.status === 'Verified' && <button className="btn btn-primary" onClick={handleCertificate}><Award size={16} /> Generate Certificate</button>}
        <button className="btn btn-ghost" onClick={() => navigate('/app/verify')}><RefreshCw size={16} /> Verify Another</button>
        <button className="btn btn-secondary" onClick={() => setChatOpen(true)} style={{ color: 'var(--accent-text)', borderColor: 'rgba(99,102,241,0.3)' }}>
          <MessageSquare size={16} /> Ask Gemini AI
        </button>
      </div>

      {/* Gemini Chat Panel */}
      {chatOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(9,9,11,0.7)', zIndex: 300,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
          padding: 24, backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            width: '100%', maxWidth: 420, height: '70vh',
            background: 'var(--bg-1)', border: '1px solid var(--border-2)',
            borderRadius: 'var(--r-xl)', display: 'flex', flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)',
          }}>
            {/* Chat header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={16} style={{ color: 'var(--accent-text)' }} />
                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Gemini AI Assistant</span>
                <span style={{ fontSize: 11, color: 'var(--text-4)' }}>1 credit/message</span>
              </div>
              <button className="btn-icon" onClick={() => setChatOpen(false)}><X size={16} /></button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%', padding: '8px 12px', borderRadius: 'var(--r-md)',
                    fontSize: 'var(--text-sm)', lineHeight: 1.5,
                    background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-3)',
                    color: msg.role === 'user' ? '#fff' : 'var(--text-1)',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', gap: 4, padding: '8px 12px' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-4)', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-1)', display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                style={{ flex: 1, padding: '8px 12px' }}
                placeholder="Ask about the verification..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                disabled={chatLoading}
              />
              <button className="btn btn-primary" style={{ padding: '8px 12px' }} onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
