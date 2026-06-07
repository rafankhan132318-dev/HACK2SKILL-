-- ═══════════════════════════════════════════════════
-- SpoProof — Full Database Schema
-- Run each block in Supabase SQL Editor
-- ═══════════════════════════════════════════════════

-- 1. USERS (extends Supabase auth.users)
CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  provider      TEXT NOT NULL DEFAULT 'email',
  credits       INTEGER NOT NULL DEFAULT 10,
  plan          TEXT NOT NULL DEFAULT 'free',
  organization  TEXT,
  role          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. VERIFICATIONS
CREATE TABLE public.verifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL,           -- Verified | Suspicious | Fake
  trust_score     INTEGER NOT NULL,        -- 0-100
  media_type      TEXT NOT NULL,           -- image | video | screenshot | article | url
  file_name       TEXT,
  file_size       BIGINT,
  submitted_url   TEXT,
  metrics         JSONB NOT NULL DEFAULT '{}',
  signals         JSONB NOT NULL DEFAULT '{}',
  recommendation  TEXT NOT NULL DEFAULT '',
  credits_used    INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CERTIFICATES
CREATE TABLE public.certificates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_id           TEXT NOT NULL UNIQUE,   -- CERT-2026-XXX
  verification_id   UUID NOT NULL REFERENCES public.verifications(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  asset             TEXT NOT NULL,
  owner             TEXT NOT NULL,
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ALERTS (platform-wide, not per user)
CREATE TABLE public.alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity    TEXT NOT NULL,           -- high | medium | low
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  source      TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TRUSTED SOURCES
CREATE TABLE public.trusted_sources (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  domain     TEXT NOT NULL UNIQUE,
  category   TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. REFERENCE HASHES (known authentic + manipulated media)
CREATE TABLE public.reference_hashes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label          TEXT NOT NULL,
  phash          TEXT NOT NULL UNIQUE,
  is_manipulated BOOLEAN NOT NULL DEFAULT FALSE,
  source_domain  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CREDIT LEDGER (audit trail of credit usage)
CREATE TABLE public.credit_ledger (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,     -- verify | gemini_chat | deep_scan | topup
  delta       INTEGER NOT NULL,  -- negative = deduction, positive = topup
  balance     INTEGER NOT NULL,  -- balance after this transaction
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. USER SETTINGS
CREATE TABLE public.user_settings (
  user_id              UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email_notifications  BOOLEAN NOT NULL DEFAULT TRUE,
  alert_notifications  BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_reports       BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_emails     BOOLEAN NOT NULL DEFAULT FALSE,
  dark_mode            BOOLEAN NOT NULL DEFAULT TRUE,
  compact_view         BOOLEAN NOT NULL DEFAULT FALSE,
  animations           BOOLEAN NOT NULL DEFAULT TRUE,
  two_factor           BOOLEAN NOT NULL DEFAULT FALSE,
  login_alerts         BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_verifications_user_id ON public.verifications(user_id);
CREATE INDEX idx_verifications_created_at ON public.verifications(created_at DESC);
CREATE INDEX idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX idx_credit_ledger_user_id ON public.credit_ledger(user_id);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at DESC);

-- ── RLS POLICIES ─────────────────────────────────────────────────────────────
-- Backend uses service role key so RLS is bypassed — but enable it for safety
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- ── SEED: TRUSTED SOURCES ────────────────────────────────────────────────────
INSERT INTO public.trusted_sources (name, domain, category) VALUES
  ('ESPN',              'espn.com',           'broadcaster'),
  ('BBC Sport',         'bbc.com',            'broadcaster'),
  ('Sky Sports',        'skysports.com',      'broadcaster'),
  ('Reuters Sports',    'reuters.com',        'wire'),
  ('Associated Press',  'apnews.com',         'wire'),
  ('NFL Official',      'nfl.com',            'league'),
  ('NBA Official',      'nba.com',            'league'),
  ('FIFA Official',     'fifa.com',           'league'),
  ('UEFA Official',     'uefa.com',           'league'),
  ('Premier League',    'premierleague.com',  'league'),
  ('The Athletic',      'theathletic.com',    'publication'),
  ('Bleacher Report',   'bleacherreport.com', 'publication'),
  ('CBS Sports',        'cbssports.com',      'broadcaster'),
  ('Fox Sports',        'foxsports.com',      'broadcaster'),
  ('Sports Illustrated','si.com',             'publication'),
  ('Sky Sports',        'cricket.com',        'publication'),
  ('Goal.com',          'goal.com',           'publication');

-- ── SEED: ALERTS ─────────────────────────────────────────────────────────────
INSERT INTO public.alerts (severity, title, description, source) VALUES
  ('high', 'Deepfake detected in viral penalty clip', 'A heavily manipulated video claiming to show an incorrectly awarded penalty is circulating across social platforms. AI confidence: 94%.', 'X (Twitter)'),
  ('high', 'Fabricated transfer announcement screenshot', 'Fake screenshot mimicking official club announcement about a star player transfer. Metadata analysis reveals Photoshop artifacts.', 'Instagram'),
  ('medium', 'Suspicious slow-motion goal replay', 'Video appears to have spliced frames from two different matches. Source verification inconclusive.', 'YouTube'),
  ('medium', 'Altered referee decision graphic', 'Stats overlay graphic has been modified to show incorrect VAR decision data. Original source identified.', 'Reddit'),
  ('low', 'Reposted match highlights with misleading caption', 'Old match footage being shared as current season content. Content verified as authentic but context is misleading.', 'TikTok'),
  ('low', 'Fan-edited celebration montage flagged', 'User-generated edit contains watermark removal from official broadcaster content. Ownership violation detected.', 'X (Twitter)');
