import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck, ScanSearch, Lock,
  Users, Newspaper, Building2, Trophy, Heart,
  ArrowRight, Menu, X, Upload, BarChart3,
  Zap, Globe, Eye
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'

/* ========== HOOKS ========== */

function useScrollReveal(threshold = 0.12) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const handler = (e) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler, { passive: true })
    return () => window.removeEventListener('mousemove', handler)
  }, [])
  return pos
}

/* ========== COMPONENTS ========== */

function Reveal({ children, delay = 0, className = '', style = {} }) {
  const [ref, visible] = useScrollReveal(0.08)
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

/* Animated text that reveals word by word */
function TextReveal({ text, delay = 0, className = '' }) {
  const [ref, visible] = useScrollReveal(0.2)
  const words = text.split(' ')
  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i} style={{
          display: 'inline-block',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) rotateX(0)' : 'translateY(40px) rotateX(-45deg)',
          transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${delay + i * 0.06}s`,
          marginRight: '0.3em',
          transformOrigin: 'bottom',
        }}>
          {word}
        </span>
      ))}
    </span>
  )
}

/* 3D tilt card */
function TiltCard({ children, className = '' }) {
  const ref = useRef(null)
  const [style, setStyle] = useState({})

  const handleMove = useCallback((e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setStyle({
      transform: `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`,
      transition: 'transform 0.1s ease',
    })
  }, [])

  const handleLeave = useCallback(() => {
    setStyle({ transform: 'perspective(800px) rotateY(0) rotateX(0) scale(1)', transition: 'transform 0.5s ease' })
  }, [])

  return (
    <div ref={ref} className={className} style={style} onMouseMove={handleMove} onMouseLeave={handleLeave}>
      {children}
    </div>
  )
}

/* ========== MAIN ========== */

export default function LandingPage() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const mouse = useMousePosition()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="lp">
      {/* Cursor spotlight */}
      <div className="cursor-spotlight" style={{ left: mouse.x, top: mouse.y }} />

      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* NAVBAR */}
      <nav className="navbar" style={{
        background: scrolled ? 'rgba(15,15,18,0.75)' : 'rgba(15,15,18,0.4)',
        borderColor: scrolled ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
      }}>
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo">
            <div className="navbar-logo-icon"><ShieldCheck size={14} color="#fff" /></div>
            SpoProof
          </Link>
          <div className="navbar-links">
            <a href="#features" className="navbar-link">Features</a>
            <a href="#process" className="navbar-link">How It Works</a>
            <a href="#who" className="navbar-link">Who It's For</a>
            <Link to="/auth" className="navbar-link">Login</Link>
          </div>
          <div className="navbar-actions">
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/auth')}>Get Started</button>
            <button className="navbar-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-aurora" />
        <div className="hero-aurora hero-aurora-2" />
        <div className="hero-grid-bg" />

        <div className="hero-badge animate-in" style={{ animationDelay: '0.3s' }}>
          <span className="hero-badge-dot" />
          AI-Powered Sports Media Verification
        </div>

        <h1 className="hero-title">
          <TextReveal text="Verify every satisfying sports clip before it trends." delay={0.4} />
        </h1>

        <p className="hero-subtitle animate-in" style={{ animationDelay: '0.9s' }}>
          Stop fake edits, confirm sources, and protect digital sports content with AI-powered forensic analysis — in seconds.
        </p>

        <div className="hero-buttons animate-in" style={{ animationDelay: '1.1s' }}>
          <button className="btn-cta-primary" onClick={() => navigate('/auth')}>
            <span>Get Started</span>
            <ArrowRight size={16} />
          </button>
          <button className="btn btn-secondary btn-lg">Watch Demo</button>
        </div>
      </section>

      {/* ===== BENTO FEATURES ===== */}
      <section id="features" className="section">
        <div className="container">
          <Reveal>
            <p className="section-label">Capabilities</p>
            <h2 className="section-title">Everything you need to<br/>keep sports media honest.</h2>
          </Reveal>

          <div className="bento-grid">
            <Reveal delay={0.1} className="bento-item bento-large">
              <TiltCard className="bento-card">
                <div className="bento-card-glow" />
                <div className="bento-icon"><ShieldCheck size={22} /></div>
                <h3>Instant Authenticity Verification</h3>
                <p>Upload any sports media — images, videos, screenshots — and receive a comprehensive trust score within seconds. Our AI engine analyzes pixel patterns, compression artifacts, and metadata integrity.</p>
                <div className="bento-visual">
                  <div className="bento-score-ring">
                    <svg viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-2)" strokeWidth="4" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent)" strokeWidth="4"
                        strokeDasharray="264" strokeDashoffset="26" strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1.5s ease', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                      />
                    </svg>
                    <span className="bento-score-value">97%</span>
                  </div>
                </div>
              </TiltCard>
            </Reveal>

            <Reveal delay={0.2} className="bento-item">
              <TiltCard className="bento-card">
                <div className="bento-card-glow" />
                <div className="bento-icon"><ScanSearch size={22} /></div>
                <h3>Deepfake & Tamper Detection</h3>
                <p>Identify doctored images, deepfake videos, spliced frames, and pixel-level edits with forensic-grade precision.</p>
              </TiltCard>
            </Reveal>

            <Reveal delay={0.3} className="bento-item">
              <TiltCard className="bento-card">
                <div className="bento-card-glow" />
                <div className="bento-icon"><Lock size={22} /></div>
                <h3>Ownership Protection</h3>
                <p>Issue verifiable certificates, track asset distribution, and defend content against unauthorized usage.</p>
              </TiltCard>
            </Reveal>

            <Reveal delay={0.2} className="bento-item">
              <TiltCard className="bento-card">
                <div className="bento-card-glow" />
                <div className="bento-icon"><Zap size={22} /></div>
                <h3>Real-time Alerts</h3>
                <p>Get instant notifications when suspicious sports content starts trending across social platforms.</p>
              </TiltCard>
            </Reveal>

            <Reveal delay={0.3} className="bento-item bento-wide">
              <TiltCard className="bento-card">
                <div className="bento-card-glow" />
                <div className="bento-icon"><Globe size={22} /></div>
                <h3>Global Source Cross-referencing</h3>
                <p>Cross-reference media against global databases, reverse image search engines, and verified source archives to confirm origin and context accuracy.</p>
              </TiltCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== PROCESS ===== */}
      <section id="process" className="section">
        <div className="container text-center">
          <Reveal>
            <p className="section-label">How It Works</p>
            <h2 className="section-title">Three steps to truth.</h2>
          </Reveal>
          <div className="process-grid">
            {[
              { num: '01', icon: Upload, title: 'Upload media', desc: 'Drop any image, video, screenshot, or paste a URL you want to verify.' },
              { num: '02', icon: Eye, title: 'AI scans content', desc: 'Our engine analyzes metadata, pixel integrity, source databases, and content markers.' },
              { num: '03', icon: BarChart3, title: 'Get your report', desc: 'Receive a detailed trust score, tamper risk level, and a downloadable verification certificate.' },
            ].map(({ num, icon: Icon, title, desc }, i) => (
              <Reveal key={num} delay={0.15 * i}>
                <div className="process-card">
                  <div className="process-num">{num}</div>
                  <div className="process-icon-wrap"><Icon size={20} /></div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHO IT'S FOR ===== */}
      <section id="who" className="section">
        <div className="container text-center">
          <Reveal>
            <p className="section-label">Built For</p>
            <h2 className="section-title">For everyone in sports.</h2>
          </Reveal>
          <div className="audience-grid">
            {[
              { icon: Users, name: 'Creators', desc: 'Protect your work' },
              { icon: Newspaper, name: 'Journalists', desc: 'Verify before press' },
              { icon: Building2, name: 'Clubs', desc: 'Guard your brand' },
              { icon: Trophy, name: 'Leagues', desc: 'Ensure integrity' },
              { icon: Heart, name: 'Fans', desc: 'Know what\'s real' },
            ].map(({ icon: Icon, name, desc }, i) => (
              <Reveal key={name} delay={0.1 * i}>
                <TiltCard className="audience-card">
                  <div className="audience-icon"><Icon size={18} /></div>
                  <h3>{name}</h3>
                  <p>{desc}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="final-cta-section">
        <div className="final-cta-aurora" />
        <Reveal>
          <p className="section-label" style={{ color: 'var(--accent-text)' }}>Get Started</p>
          <h2 className="final-cta-title">Ready to verify<br/>before it trends?</h2>
          <p className="final-cta-desc">Upload your first file and see the results in under 30 seconds — no credit card required.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
            <button className="btn-cta-primary" onClick={() => navigate('/auth')}>
              <span>Get Started</span>
              <ArrowRight size={16} />
            </button>
            <button className="btn btn-secondary btn-lg">Learn More</button>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-4)' }}>© 2026 SpoProof</span>
            <div className="footer-links">
              <a href="#" className="footer-link">Privacy</a>
              <a href="#" className="footer-link">Terms</a>
              <a href="#" className="footer-link">Contact</a>
              <a href="#" className="footer-link">Twitter</a>
              <a href="#" className="footer-link">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
