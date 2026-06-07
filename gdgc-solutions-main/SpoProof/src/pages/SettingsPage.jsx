// src/pages/SettingsPage.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

const tabs = ['Profile', 'Notifications', 'Appearance', 'Security', 'Billing']

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('Profile')
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Profile fields
  const [name, setName] = useState(user?.name ?? '')
  const [organization, setOrganization] = useState(user?.organization ?? '')
  const [role, setRole] = useState(user?.role ?? '')

  // Password fields
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  useEffect(() => {
    api.getSettings().then(r => setSettings(r.data)).catch(console.error)
  }, [])

  const save = async (fn) => {
    setSaving(true); setSaved(false)
    try { await fn(); setSaved(true); setTimeout(() => setSaved(false), 2000) }
    catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const saveProfile = () => save(async () => {
    const { user: updated } = await api.updateProfile({ name, organization, role })
    updateUser(updated)
  })

  const saveSetting = async (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    await api.updateSettings({ [key]: value }).catch(console.error)
  }

  const savePassword = () => save(async () => {
    if (newPw !== confirmPw) throw new Error('Passwords do not match')
    if (newPw.length < 8) throw new Error('Password must be at least 8 characters')
    await api.updatePassword(currentPw, newPw)
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
  })

  const Toggle = ({ settingKey }) => (
    <label className="toggle">
      <input type="checkbox" checked={!!settings?.[settingKey]} onChange={e => saveSetting(settingKey, e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account preferences</p>
      </div>
      <div className="settings-tabs">
        {tabs.map(tab => (
          <button key={tab} className={`settings-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>
      <div className="settings-section">
        {activeTab === 'Profile' && (
          <>
            <h3>Profile Information</h3>
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={user?.email ?? ''} disabled style={{ opacity: 0.6 }} /></div>
            <div className="form-group"><label className="form-label">Organization</label><input className="form-input" value={organization} onChange={e => setOrganization(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Role</label><input className="form-input" value={role} onChange={e => setRole(e.target.value)} /></div>
            <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}</button>
          </>
        )}
        {activeTab === 'Notifications' && settings && (
          <>
            <h3>Notification Preferences</h3>
            {[['email_notifications','Email Notifications','Receive verification results via email'],
              ['alert_notifications','Alert Notifications','Get notified about high-risk content'],
              ['weekly_reports','Weekly Reports','Receive a weekly summary of your activity'],
              ['marketing_emails','Marketing Emails','Product updates and feature announcements'],
            ].map(([key, title, desc]) => (
              <div key={key} className="settings-row">
                <div className="settings-row-left"><h4>{title}</h4><p>{desc}</p></div>
                <Toggle settingKey={key} />
              </div>
            ))}
          </>
        )}
        {activeTab === 'Appearance' && settings && (
          <>
            <h3>Appearance</h3>
            {[['dark_mode','Dark Mode','Use dark theme across the application'],
              ['compact_view','Compact View','Reduce spacing in tables and lists'],
              ['animations','Animations','Enable motion and transition effects'],
            ].map(([key, title, desc]) => (
              <div key={key} className="settings-row">
                <div className="settings-row-left"><h4>{title}</h4><p>{desc}</p></div>
                <Toggle settingKey={key} />
              </div>
            ))}
          </>
        )}
        {activeTab === 'Security' && (
          <>
            <h3>Security</h3>
            <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" placeholder="••••••••" value={currentPw} onChange={e => setCurrentPw(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" placeholder="••••••••" value={newPw} onChange={e => setNewPw(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Confirm New Password</label><input className="form-input" type="password" placeholder="••••••••" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} /></div>
            <button className="btn btn-primary" onClick={savePassword} disabled={saving} style={{ marginBottom: 32 }}>{saving ? 'Updating...' : saved ? '✓ Updated' : 'Update Password'}</button>
            {settings && <>
              {[['two_factor','Two-Factor Authentication','Add an extra layer of security'],
                ['login_alerts','Login Alerts','Get notified of new device sign-ins'],
              ].map(([key, title, desc]) => (
                <div key={key} className="settings-row">
                  <div className="settings-row-left"><h4>{title}</h4><p>{desc}</p></div>
                  <Toggle settingKey={key} />
                </div>
              ))}
            </>}
          </>
        )}
        {activeTab === 'Billing' && (
          <>
            <h3>Billing & Plan</h3>
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>{user?.plan === 'pro' ? 'Pro' : 'Free'} Plan</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    {user?.plan === 'pro' ? 'Unlimited verifications • Priority support • API access' : 'Limited verifications • Standard support'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>{user?.plan === 'pro' ? '$49' : 'Free'}<span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>{user?.plan === 'pro' ? '/mo' : ''}</span></div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-4)', marginTop: 4 }}>Credits remaining: <strong style={{ color: 'var(--accent-text)' }}>{user?.credits ?? 0}</strong></div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary">Change Plan</button>
              <button className="btn btn-ghost">View Invoices</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
