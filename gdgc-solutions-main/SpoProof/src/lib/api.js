// src/lib/api.js
// ─── Central API client for SpoProof frontend ────────────────────────────────

let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
if (!baseUrl.endsWith('/api')) baseUrl += '/api';
const BASE = baseUrl;

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('spoproof_token')
export const setToken = (t) => localStorage.setItem('spoproof_token', t)
export const clearToken = () => localStorage.removeItem('spoproof_token')

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function req(path, options = {}) {
  const token = getToken()
  const headers = { ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(data.message || `Request failed: ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const api = {
  // Redirect browser to Google OAuth
  googleLogin: () => {
    window.location.href = `${BASE}/auth/google`
  },

  // Email auth
  register: (name, email, password) =>
    req('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  login: (email, password) =>
    req('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  getMe: () => req('/auth/me'),

  updateProfile: (data) =>
    req('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),

  // ── Verify ────────────────────────────────────────────────────────────────
  verify: (fileOrUrl, type) => {
    const form = new FormData()
    if (fileOrUrl instanceof File) {
      form.append('file', fileOrUrl)
    } else {
      form.append('url', fileOrUrl)
    }
    form.append('type', type)
    return req('/verify', { method: 'POST', body: form })
  },

  getVerification: (id) => req(`/verify/${id}`),

  // ── Dashboard ─────────────────────────────────────────────────────────────
  getDashboard: () => req('/dashboard'),

  // ── Reports ───────────────────────────────────────────────────────────────
  getReports: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return req(`/reports${q ? `?${q}` : ''}`)
  },

  downloadReport: (id) => req(`/reports/${id}/download`),

  // ── Certificates ──────────────────────────────────────────────────────────
  getCertificates: () => req('/certificates'),

  generateCertificate: (verificationId) =>
    req('/certificates', { method: 'POST', body: JSON.stringify({ verificationId }) }),

  downloadCertificate: (id) => req(`/certificates/${id}/download`),

  // ── Alerts ────────────────────────────────────────────────────────────────
  getAlerts: () => req('/alerts'),

  markAlertRead: (id) =>
    req(`/alerts/${id}/read`, { method: 'PATCH' }),

  // ── Settings ──────────────────────────────────────────────────────────────
  getSettings: () => req('/settings'),

  updateSettings: (data) =>
    req('/settings', { method: 'PATCH', body: JSON.stringify(data) }),

  updatePassword: (currentPassword, newPassword) =>
    req('/settings/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),

  // ── Credits ───────────────────────────────────────────────────────────────
  getCredits: () => req('/credits'),

  // ── Gemini Chat ───────────────────────────────────────────────────────────
  geminiChat: (verificationId, message, history = []) =>
    req('/gemini/chat', {
      method: 'POST',
      body: JSON.stringify({ verificationId, message, history }),
    }),
}
