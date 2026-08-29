// Settings — account, privacy, notifications, appearance, playback, language,
// blocked users, help & support, about.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../lib/icons'
import { BRAND } from '../config/brand'
import { useStore, useUser } from '../store/useStore'
import { Avatar, Segmented, Toggle, Modal, Button } from '../components/ui'
import { resetDB } from '../lib/db'

const LANGS = [
  ['en', 'English'], ['hi', 'हिन्दी (Hindi)'], ['es', 'Español'], ['fr', 'Français'],
  ['pt', 'Português'], ['de', 'Deutsch'], ['ja', '日本語'],
]

const FAQS = [
  ['How do I upload a video?', 'Tap the + button in the navigation bar and choose “Upload video”. Pick a file, add a title, and publish.'],
  ['Who can see my saved videos?', 'Only you. Your saved collection is private and visible on your profile under the “Saved” tab.'],
  ['How do recommendations work?', 'VibeX mixes trending content with uploads from creators you follow. Use “Not interested” on any card to tune your feed.'],
  ['Is this a real backend?', 'No — this is a production-style frontend demo. All data lives locally in your browser, and the data layer is isolated so a real API can be connected.'],
]

function Row({ icon, label, desc, children, onClick }) {
  const inner = (
    <>
      <span className="set-ic"><Icon name={icon} size={19} /></span>
      <span className="set-text"><strong>{label}</strong>{desc && <small>{desc}</small>}</span>
      <span className="set-control">{children || <Icon name="chevR" size={17} />}</span>
    </>
  )
  return onClick
    ? <button type="button" className="set-row" onClick={onClick}>{inner}</button>
    : <div className="set-row">{inner}</div>
}

export default function Settings() {
  const me = useUser()
  const navigate = useNavigate()
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const autoplay = useStore((s) => s.autoplay)
  const setAutoplay = useStore((s) => s.setAutoplay)
  const language = useStore((s) => s.language)
  const setLanguage = useStore((s) => s.setLanguage)
  const notifPrefs = useStore((s) => s.notifPrefs)
  const setNotifPref = useStore((s) => s.setNotifPref)
  const blocked = useStore((s) => s.blocked)
  const toggleBlocked = useStore((s) => s.toggleBlocked)
  const db = useStore((s) => s.db)
  const [faq, setFaq] = useState(null)
  const [about, setAbout] = useState(false)
  const [privateAcc, setPrivateAcc] = useState(false)

  return (
    <div className="page settings-page">
      <h2 className="settings-title">Settings</h2>

      <section className="set-group">
        <div className="side-label">Account</div>
        {me && (
          <button type="button" className="set-row" onClick={() => navigate(`/profile/${me.username}`)}>
            <Avatar user={me} size={42} />
            <span className="set-text"><strong>{me.displayName}</strong><small>@{me.username} — view profile</small></span>
            <span className="set-control"><Icon name="chevR" size={17} /></span>
          </button>
        )}
        <Row icon="lock" label="Password & security" desc="Demo auth — passwords are hashed locally"
          onClick={() => navigate('/auth')} />
        <Row icon="logout" label="Sign out" onClick={() => navigate('/auth?out=1')} />
      </section>

      <section className="set-group">
        <div className="side-label">Appearance</div>
        <div className="set-row wrap">
          <span className="set-ic"><Icon name="moon" size={19} /></span>
          <span className="set-text"><strong>Theme</strong><small>Dark, light, or match your device</small></span>
        </div>
        <div className="set-pad">
          <Segmented
            ariaLabel="Theme"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: 'Light', icon: 'sun' },
              { value: 'dark', label: 'Dark', icon: 'moon' },
              { value: 'system', label: 'System', icon: 'monitor' },
            ]}
          />
        </div>
      </section>

      <section className="set-group">
        <div className="side-label">Playback</div>
        <Row icon="play" label="Autoplay videos" desc="Start playing when you open a video">
          <Toggle checked={autoplay} onChange={setAutoplay} label="Autoplay videos" />
        </Row>
        <Row icon="mute" label="Mute shorts by default" desc="Recommended for public places">
          <Toggle checked={useStore((s) => s.muted)} onChange={(v) => useStore.getState().setMuted(v)} label="Mute shorts by default" />
        </Row>
      </section>

      <section className="set-group">
        <div className="side-label">Notifications</div>
        {[['likes', 'Likes', 'heart'], ['comments', 'Comments & replies', 'comment'], ['followers', 'New followers', 'user'], ['uploads', 'Uploads from creators you follow', 'upload'], ['messages', 'Messages', 'mail']].map(([key, label, icon]) => (
          <Row key={key} icon={icon} label={label}>
            <Toggle checked={!!notifPrefs[key]} onChange={(v) => setNotifPref(key, v)} label={label} />
          </Row>
        ))}
      </section>

      <section className="set-group">
        <div className="side-label">Privacy</div>
        <Row icon="lock" label="Private account" desc="Only approved followers can see your posts (demo)">
          <Toggle checked={privateAcc} onChange={setPrivateAcc} label="Private account" />
        </Row>
      </section>

      <section className="set-group">
        <div className="side-label">Language</div>
        <div className="set-pad">
          <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Language">
            {LANGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <p className="field-hint">Full interface translation is coming soon — this preference is saved now.</p>
        </div>
      </section>

      <section className="set-group">
        <div className="side-label">Blocked users</div>
        {blocked.length === 0 && <p className="lib-empty pad">You haven’t blocked anyone.</p>}
        {blocked.map((id) => {
          const u = db.users.find((x) => x.id === id)
          if (!u) return null
          return (
            <div key={id} className="set-row">
              <Avatar user={u} size={36} />
              <span className="set-text"><strong>{u.displayName}</strong><small>@{u.username}</small></span>
              <span className="set-control">
                <Button variant="soft" size="sm" onClick={() => toggleBlocked(id)}>Unblock</Button>
              </span>
            </div>
          )
        })}
      </section>

      <section className="set-group">
        <div className="side-label">Help & support</div>
        {FAQS.map(([q, a], i) => (
          <div key={i}>
            <Row icon="help" label={q} onClick={() => setFaq(faq === i ? null : i)}>
              <Icon name={faq === i ? 'chevU' : 'chevD'} size={17} />
            </Row>
            {faq === i && <p className="faq-answer">{a}</p>}
          </div>
        ))}
        <Row icon="info" label={`About ${BRAND.name}`} onClick={() => setAbout(true)} />
      </section>

      <section className="set-group danger-zone">
        <div className="side-label">Demo data</div>
        <Row icon="refresh" label="Reset demo data" desc="Restore the original seed content">
          <Button variant="danger" size="sm" onClick={() => { if (confirm('Reset all demo data? This restores the original content.')) resetDB() }}>Reset</Button>
        </Row>
      </section>

      {about && (
        <Modal onClose={() => setAbout(false)} title={`About ${BRAND.name}`}>
          <div className="about-box">
            <div className="brand-mark cm-mark"><Icon name="play" size={20} solid /></div>
            <h4>{BRAND.name}</h4>
            <p>{BRAND.tagline}</p>
            <p className="muted small">
              Version 1.0.0 · Demo build.<br />
              A production-style social video frontend with a local mock data layer.
              Rebrand via <code>src/config/brand.js</code>. Demo videos are CC-licensed
              Blender Foundation / sample clips; thumbnails & avatars are generated artwork.
            </p>
            <Link to="/admin" className="btn btn-soft" onClick={() => setAbout(false)}><Icon name="chart" size={16} /> Admin dashboard</Link>
          </div>
        </Modal>
      )}
    </div>
  )
}
