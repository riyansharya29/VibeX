// Auth — sign in / sign up / forgot password, against the isolated demo auth
// service (src/lib/auth.js). Swap that module for a real provider later.
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../lib/icons'
import { BRAND } from '../config/brand'
import { clsx } from '../lib/format'
import { useStore } from '../store/useStore'
import { login, signup, logout } from '../lib/auth'
import { saveDB } from '../lib/db'
import { BrandMark } from '../components/chrome'

function Field({ label, error, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  )
}

export default function Auth() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const db = useStore((s) => s.db)
  const setUser = useStore((s) => s.setUser)
  const toast = useStore((s) => s.toast)
  const [mode, setMode] = useState('login') // login | signup | forgot
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [f, setF] = useState({ name: '', username: '', email: '', password: '', identifier: '' })

  useEffect(() => {
    if (params.get('out') === '1') {
      logout()
      toast('Signed out', 'logout')
    }
  }, [params]) // eslint-disable-line react-hooks/exhaustive-deps

  const upd = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const commit = (user) => {
    saveDB(db)
    useStore.getState().commit(db)
    setUser(user.id)
    toast(`Welcome${mode === 'signup' ? '' : ' back'}, ${user.displayName.split(' ')[0]}!`, 'badge')
    navigate('/')
  }

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    // small delay makes the flow feel real
    await new Promise((r) => setTimeout(r, 450))
    try {
      if (mode === 'forgot') {
        if (!/^\S+@\S+\.\S+$/.test(f.identifier)) throw new Error('Enter a valid email address.')
        toast('Password reset link sent (demo)', 'mail')
        setMode('login')
      } else if (mode === 'login') {
        commit(login(db, { identifier: f.identifier, password: f.password }))
      } else {
        commit(signup(db, f))
      }
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setBusy(false)
    }
  }

  const quick = (which) => {
    setErr('')
    try {
      const user = login(db, which === 'admin'
        ? { identifier: 'admin@vibex.app', password: 'vibe1234' }
        : { identifier: 'rinwaves', password: 'vibe1234' })
      commit(user)
    } catch (e2) { setErr(e2.message) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <BrandMark size={40} />
          <p>{BRAND.tagline}</p>
        </div>

        {mode !== 'forgot' && (
          <div className="seg auth-seg" role="tablist" aria-label="Auth mode">
            <button type="button" role="tab" aria-selected={mode === 'login'}
              className={clsx('seg-item', mode === 'login' && 'active')} onClick={() => { setMode('login'); setErr('') }}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === 'signup'}
              className={clsx('seg-item', mode === 'signup' && 'active')} onClick={() => { setMode('signup'); setErr('') }}>Sign up</button>
          </div>
        )}

        <form className="auth-form" onSubmit={submit} noValidate>
          {mode === 'signup' && (
            <>
              <Field label="Name">
                <input className="input" value={f.name} onChange={upd('name')} placeholder="Ada Lovelace" autoComplete="name" />
              </Field>
              <Field label="Username">
                <input className="input" value={f.username} onChange={upd('username')} placeholder="ada.codes" autoComplete="username" />
              </Field>
              <Field label="Email">
                <input className="input" type="email" value={f.email} onChange={upd('email')} placeholder="you@example.com" autoComplete="email" />
              </Field>
              <Field label="Password">
                <input className="input" type="password" value={f.password} onChange={upd('password')} placeholder="6+ characters" autoComplete="new-password" />
              </Field>
            </>
          )}

          {mode === 'login' && (
            <>
              <Field label="Email or username">
                <input className="input" value={f.identifier} onChange={upd('identifier')} placeholder="rinwaves or you@example.com" autoComplete="username" />
              </Field>
              <Field label="Password">
                <input className="input" type="password" value={f.password} onChange={upd('password')} placeholder="••••••••" autoComplete="current-password" />
              </Field>
              <button type="button" className="auth-forgot" onClick={() => { setMode('forgot'); setErr('') }}>Forgot password?</button>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <p className="auth-forgot-copy">Enter your account email and we’ll send a reset link. (Demo — no email is actually sent.)</p>
              <Field label="Email">
                <input className="input" type="email" value={f.identifier} onChange={upd('identifier')} placeholder="you@example.com" autoComplete="email" />
              </Field>
            </>
          )}

          {err && <div className="auth-error" role="alert"><Icon name="info" size={15} /> {err}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'forgot' ? 'Send reset link' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          {mode === 'forgot' && (
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setMode('login')}>Back to sign in</button>
          )}
        </form>

        {mode !== 'forgot' && (
          <div className="auth-quick">
            <div className="auth-or"><span />or try a demo account<span /></div>
            <div className="auth-quick-btns">
              <button type="button" className="btn btn-soft" onClick={() => quick('demo')}><Icon name="user" size={16} /> Demo user</button>
              <button type="button" className="btn btn-soft" onClick={() => quick('admin')}><Icon name="shield" size={16} /> Demo admin</button>
            </div>
            <p className="muted small center">
              Credentials are hashed locally — never stored or sent as plain text.<br />
              Demo: <code>rinwaves</code> · Admin: <code>admin@vibex.app</code> — password <code>vibe1234</code>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
