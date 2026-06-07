// src/pages/VerifyPage.jsx
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Image, Video, Camera, FileText, Link as LinkIcon, AlertCircle } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const uploadTypes = [
  { id: 'image', label: 'Image', icon: Image },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'screenshot', label: 'Screenshot', icon: Camera },
  { id: 'article', label: 'Article', icon: FileText },
  { id: 'url', label: 'URL / Social', icon: LinkIcon },
]

const analysisSteps = [
  { title: 'Checking metadata...', subtitle: 'Extracting EXIF data and file properties' },
  { title: 'Scanning for deepfakes...', subtitle: 'Running Bitmind AI analysis' },
  { title: 'Comparing sources...', subtitle: 'Reverse image search + fact checking' },
  { title: 'Generating trust score...', subtitle: 'Compiling all signals into final verdict' },
]

const SOCIAL_DOMAINS = ['instagram.com', 'tiktok.com', 'twitter.com', 'x.com', 'facebook.com', 'youtube.com', 'youtu.be', 'reddit.com']

function isSocial(url) {
  try { return SOCIAL_DOMAINS.some(d => new URL(url).hostname.includes(d)) }
  catch { return false }
}

export default function VerifyPage() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()

  const [selectedType, setSelectedType] = useState('image')
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [urlInput, setUrlInput] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); setSelectedType(f.type.startsWith('video/') ? 'video' : 'image') }
  }, [])

  const handleFileInput = (e) => {
    const f = e.target.files[0]
    if (f) { setFile(f); setSelectedType(f.type.startsWith('video/') ? 'video' : 'image') }
  }

  const canAnalyze = file || (selectedType === 'url' && urlInput.trim())

  const handleAnalyze = async () => {
    if (!canAnalyze) return
    if ((user?.credits ?? 0) < 1) {
      setError('Not enough credits to run a verification.')
      return
    }

    setError('')
    setAnalyzing(true)
    setCurrentStep(0)
    setProgress(0)

    // Animate steps while API runs
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        const next = prev + 1
        setProgress((next / analysisSteps.length) * 85)
        return next < analysisSteps.length - 1 ? next : prev
      })
    }, 1800)

    try {
      const payload = file || urlInput.trim()
      const result = await api.verify(payload, selectedType)

      clearInterval(stepInterval)
      setProgress(100)

      // Update credit count in UI
      if (result.creditsRemaining !== undefined) {
        updateUser({ credits: result.creditsRemaining })
      }

      setTimeout(() => {
        navigate('/app/result', { state: { result: result.data } })
      }, 500)
    } catch (err) {
      clearInterval(stepInterval)
      setAnalyzing(false)
      setError(err.status === 402
        ? `Not enough credits. You have ${user?.credits ?? 0} remaining.`
        : err.message || 'Verification failed. Please try again.')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Verify Media</h1>
        <p className="page-subtitle">Upload sports media or paste a URL — including Instagram, TikTok, YouTube</p>
      </div>

      {/* Credit warning */}
      {(user?.credits ?? 0) <= 2 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', marginBottom: 20,
          background: 'var(--amber-muted)', border: '1px solid rgba(234,179,8,0.2)',
          borderRadius: 'var(--r-md)', fontSize: 'var(--text-sm)', color: 'var(--amber-text)',
        }}>
          <AlertCircle size={14} />
          {user?.credits === 0 ? 'No credits remaining — you cannot run more verifications.' : `Low credits: ${user?.credits} remaining.`}
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', marginBottom: 20,
          background: 'var(--red-muted)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--r-md)', fontSize: 'var(--text-sm)', color: 'var(--red-text)',
        }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Upload Zone — hidden for URL type */}
      {selectedType !== 'url' && (
        <div
          className={`upload-zone${dragOver ? ' drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input id="file-input" type="file" style={{ display: 'none' }} onChange={handleFileInput}
            accept="image/*,video/*,.pdf,.doc,.docx" />
          <div className="upload-zone-icon"><Upload size={32} /></div>
          <h3>{file ? file.name : 'Drag & drop your file here'}</h3>
          <p>{file
            ? `${(file.size / 1024 / 1024).toFixed(2)} MB — Ready to analyze`
            : 'or click to browse — images, videos, screenshots, articles'
          }</p>
        </div>
      )}

      {/* URL Input */}
      {selectedType === 'url' && (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <input
            className="form-input"
            placeholder="Paste URL — instagram.com, tiktok.com, youtube.com, twitter.com or any direct media link..."
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            style={{ fontSize: 'var(--text-sm)' }}
          />
          {urlInput && isSocial(urlInput) && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-text)', marginTop: 6 }}>
              ✓ Social media URL detected — we'll extract the media automatically
            </p>
          )}
        </div>
      )}

      {/* Type selector */}
      <div className="upload-types">
        {uploadTypes.map(({ id, label, icon: Icon }) => (
          <button key={id}
            className={`upload-type${selectedType === id ? ' selected' : ''}`}
            onClick={() => { setSelectedType(id); setFile(null) }}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Cost info */}
      <p style={{ textAlign: 'center', marginTop: 12, fontSize: 'var(--text-xs)', color: 'var(--text-4)' }}>
        1 credit per verification · {user?.credits ?? 0} credits remaining
      </p>

      {/* Analyze */}
      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleAnalyze}
          disabled={!canAnalyze || analyzing || (user?.credits ?? 0) < 1}
          style={{ opacity: canAnalyze && (user?.credits ?? 0) >= 1 ? 1 : 0.5 }}
        >
          Analyze Now
        </button>
      </div>

      {/* Analysis Overlay */}
      {analyzing && (
        <div className="analysis-overlay">
          <div className="analysis-card">
            <div className="analysis-spinner" />
            <div className="analysis-step">{analysisSteps[currentStep]?.title}</div>
            <div className="analysis-substep">{analysisSteps[currentStep]?.subtitle}</div>
            <div className="analysis-progress">
              <div className="analysis-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
