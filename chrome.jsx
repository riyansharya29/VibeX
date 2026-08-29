// App chrome: brand block, top bar, desktop sidebar, mobile bottom nav.
import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../lib/icons'
import { BRAND } from '../config/brand'
import { clsx } from '../lib/format'
import { useStore, useUser } from '../store/useStore'
import { Avatar, IconButton, Menu, Toggle } from './ui'

export function BrandMark({ size = 34, wordmark = true }) {
  return (
    <Link to="/" className="brand" aria-label={`${BRAND.name} home`}>
      <span className="brand-mark" style={{ width: size, height: size }}>
        <Icon name="play" size={size * 0.5} solid />
      </span>
      {wordmark && <span className="wordmark">{BRAND.name}</span>}
    </Link>
  )
}

// ── Top bar ────────────────────────────────────────────────────
export function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const me = useUser()
  const openCreate = useStore((s) => s.openCreate)
  const unread = useStore((s) => s.db.notifications.filter((n) => n.userId === s.userId && !n.read).length)
  const [menu, setMenu] = useState(false)
  const [q, setQ] = useState('')
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)

  const submitSearch = (e) => {
    e.preventDefault()
    if (!q.trim()) return
    navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <header className="topbar">
      <div className="tb-left">
        <BrandMark />
      </div>

      <form className="tb-search" onSubmit={submitSearch} role="search">
        <Icon name="search" size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => { if (!location.pathname.startsWith('/search')) navigate('/search') }}
          placeholder={`Search ${BRAND.name}`}
          aria-label="Search"
        />
      </form>

      <div className="tb-right">
        <IconButton name="search" label="Search" className="tb-mobile-only" onClick={() => navigate('/search')} />
        <button type="button" className="btn btn-soft tb-create" onClick={openCreate}>
          <Icon name="plus" size={18} /> <span>Create</span>
        </button>
        <Link to="/notifications" className="iconbtn has-badge" aria-label="Notifications">
          <Icon name="bell" size={22} />
          {unread > 0 && <span className="badge-dot">{unread > 9 ? '9+' : unread}</span>}
        </Link>
        <span className="menu-wrap">
          <button type="button" className="avatar-btn menu-trigger" onClick={() => setMenu((v) => !v)} aria-label="Account menu">
            <Avatar user={me} size={32} />
          </button>
          {menu && (
            <Menu
              onClose={() => setMenu(false)}
              items={[
                me && { icon: 'user', label: me.displayName, right: `@${me.username}`, onClick: () => navigate(`/profile/${me.username}`) },
                { divider: true },
                { icon: 'user', label: 'Your profile', onClick: () => navigate(`/profile/${me?.username || ''}`) },
                { icon: 'library', label: 'Library', onClick: () => navigate('/library') },
                { icon: 'chart', label: 'Admin dashboard', onClick: () => navigate('/admin') },
                { divider: true },
                {
                  icon: theme === 'dark' ? 'moon' : 'sun',
                  label: 'Dark theme',
                  right: <Toggle checked={theme === 'dark'} onChange={(v) => setTheme(v ? 'dark' : 'light')} label="Dark theme" />,
                },
                { icon: 'gear', label: 'Settings', onClick: () => navigate('/settings') },
                { divider: true },
                { icon: 'logout', label: 'Sign out', onClick: () => navigate('/auth?out=1') },
              ]}
            />
          )}
        </span>
      </div>
    </header>
  )
}

// ── Desktop sidebar ────────────────────────────────────────────
const SIDE_PRIMARY = [
  { to: '/', icon: 'home', label: 'Home', end: true },
  { to: '/explore', icon: 'compass', label: 'Explore' },
  { to: '/shorts', icon: 'bolt', label: 'Shorts' },
  { to: '/following', icon: 'users', label: 'Following' },
]
const SIDE_LIBRARY = [
  { to: '/library', icon: 'library', label: 'Library' },
  { to: '/history', icon: 'clock', label: 'History' },
  { to: '/saved', icon: 'bookmark', label: 'Saved' },
]
const SIDE_SOCIAL = [
  { to: '/messages', icon: 'mail', label: 'Messages', badge: 'msg' },
  { to: '/notifications', icon: 'bell', label: 'Notifications', badge: 'notif' },
  { to: '/settings', icon: 'gear', label: 'Settings' },
]

function SideItem({ to, icon, label, end, badge }) {
  const notifCount = useStore((s) =>
    badge === 'notif' ? s.db.notifications.filter((n) => n.userId === s.userId && !n.read).length : 0
  )
  const msgCount = useStore((s) =>
    badge === 'msg'
      ? s.db.conversations.reduce((acc, cv) => acc + (cv.messages.some((m) => m.senderId !== s.userId && !m.read) ? 1 : 0), 0)
      : 0
  )
  const count = badge === 'notif' ? notifCount : msgCount
  return (
    <NavLink to={to} end={end} className={({ isActive }) => clsx('side-item', isActive && 'active')}>
      <Icon name={icon} size={21} />
      <span>{label}</span>
      {count > 0 && <span className="side-badge">{count > 9 ? '9+' : count}</span>}
    </NavLink>
  )
}

export function Sidebar() {
  const me = useUser()
  const following = useStore((s) => s.following)
  const followedCreators = useStore((s) => s.db.users.filter((u) => s.following[u.id] && u.isCreator))
  void following
  return (
    <aside className="sidebar" aria-label="Primary">
      <nav className="side-nav">
        {SIDE_PRIMARY.map((i) => <SideItem key={i.to} {...i} />)}
        <div className="side-divider" />
        {SIDE_LIBRARY.map((i) => <SideItem key={i.to} {...i} />)}
        <div className="side-divider" />
        {SIDE_SOCIAL.map((i) => <SideItem key={i.to} {...i} />)}
        <div className="side-divider" />
        <div className="side-label">Following</div>
        <div className="side-creators">
          {followedCreators.length === 0 && <p className="side-hint">Follow creators to see them here.</p>}
          {followedCreators.slice(0, 8).map((c) => (
            <Link key={c.id} to={`/profile/${c.username}`} className="side-item">
              <Avatar user={c} size={22} />
              <span className="side-cname">{c.displayName}</span>
              <span className="side-live" aria-hidden="true" />
            </Link>
          ))}
        </div>
        <div className="side-divider" />
        {me && (
          <Link to={`/profile/${me.username}`} className="side-item side-me">
            <Avatar user={me} size={24} />
            <span>Your profile</span>
          </Link>
        )}
      </nav>
      <footer className="side-foot">
        <BrandMark size={26} />
        <p>{BRAND.tagline}</p>
      </footer>
    </aside>
  )
}

// ── Mobile bottom navigation ───────────────────────────────────
const BN_LEFT = [
  { to: '/', icon: 'home', label: 'Home', end: true },
  { to: '/explore', icon: 'compass', label: 'Explore' },
]
const BN_RIGHT = [
  { to: '/shorts', icon: 'bolt', label: 'Shorts' },
]

export function BottomNav() {
  const me = useUser()
  const openCreate = useStore((s) => s.openCreate)
  const location = useLocation()
  const profileActive = location.pathname.startsWith('/profile')
  return (
    <nav className="bottomnav" aria-label="Mobile navigation">
      {BN_LEFT.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => clsx('bn-item', isActive && 'active')}>
          <Icon name={i.icon} size={23} />
          <span>{i.label}</span>
        </NavLink>
      ))}
      <button type="button" className="bn-create" onClick={openCreate} aria-label="Create">
        <Icon name="plus" size={26} />
      </button>
      {BN_RIGHT.map((i) => (
        <NavLink key={i.to} to={i.to} className={({ isActive }) => clsx('bn-item', isActive && 'active')}>
          <Icon name={i.icon} size={23} />
          <span>{i.label}</span>
        </NavLink>
      ))}
      <NavLink to={`/profile/${me?.username || 'me'}`} className={clsx('bn-item', profileActive && 'active')}>
        <Avatar user={me} size={24} />
        <span>Profile</span>
      </NavLink>
    </nav>
  )
}
