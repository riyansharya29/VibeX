// Admin dashboard — platform totals + moderation queue for reported
// videos / comments / users. Guarded by the isAdmin flag on the account.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../lib/icons'
import { clsx, fmt, fmtFull, timeAgo } from '../lib/format'
import { useStore, useUser } from '../store/useStore'
import { Avatar, EmptyState, Button, SectionHeader } from '../components/ui'
import { login } from '../lib/auth'
import { saveDB } from '../lib/db'

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="stat-card">
      <span className="stat-ic"><Icon name={icon} size={20} /></span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        {sub && <small className="stat-sub">{sub}</small>}
      </div>
    </div>
  )
}

export default function Admin() {
  const me = useUser()
  const navigate = useNavigate()
  const db = useStore((s) => s.db)
  const resolveReport = useStore((s) => s.resolveReport)
  const setUser = useStore((s) => s.setUser)
  const toast = useStore((s) => s.toast)
  const [tab, setTab] = useState('video')
  const [authErr, setAuthErr] = useState('')

  const signInAsAdmin = () => {
    try {
      const user = login(useStore.getState().db, { identifier: 'admin@vibex.app', password: 'vibe1234' })
      saveDB(useStore.getState().db)
      setUser(user.id)
      toast('Signed in as admin', 'shield')
    } catch (e) {
      setAuthErr(e.message)
    }
  }

  if (!me?.isAdmin) {
    return (
      <div className="page">
        <EmptyState icon="shield" title="Admins only"
          body="Sign in with an administrator account to open the dashboard.">
          <Button variant="primary" onClick={signInAsAdmin}><Icon name="shield" size={16} /> Continue as demo admin</Button>
          <Button variant="ghost" onClick={() => navigate('/')}>Back home</Button>
          {authErr && <p className="field-error">{authErr}</p>}
        </EmptyState>
      </div>
    )
  }

  const totalViews = db.videos.reduce((a, v) => a + v.views, 0) + db.shorts.reduce((a, s) => a + s.views, 0)
  const openReports = db.reports.filter((r) => r.status === 'open')
  const byType = (t) => openReports.filter((r) => r.type === t)

  const ReportRow = ({ r }) => {
    let target = null, label = '', linkTo = null
    if (r.type === 'video') {
      target = db.videos.find((v) => v.id === r.targetId)
      label = target ? target.title : '(video already removed)'
      linkTo = target ? `/watch/${target.id}` : null
    } else if (r.type === 'short') {
      target = db.shorts.find((s) => s.id === r.targetId)
      label = target ? target.caption : '(short already removed)'
      linkTo = target ? `/shorts/${target.id}` : null
    } else if (r.type === 'comment') {
      target = db.comments.find((c) => c.id === r.targetId)
      const author = target && db.users.find((u) => u.id === target.userId)
      label = target ? `“${target.text}” — ${author?.displayName || 'unknown'}` : '(comment already removed)'
    } else if (r.type === 'user') {
      target = db.users.find((u) => u.id === r.targetId)
      label = target ? `@${target.username} — ${target.displayName}` : '(user not found)'
      linkTo = target ? `/profile/${target.username}` : null
    }
    const reporter = db.users.find((u) => u.id === r.reporterId)
    return (
      <div className="mod-row">
        <div className="mod-info">
          <div className="mod-reason"><Icon name="flag" size={15} /> {r.reason}</div>
          <div className="mod-target">
            {linkTo ? <Link to={linkTo}>{label}</Link> : label}
          </div>
          <div className="v-sub">Reported by {reporter?.displayName || 'user'} · {timeAgo(r.createdAt)}</div>
        </div>
        <div className="mod-actions">
          <Button variant="danger" size="sm" onClick={() => resolveReport(r.id, 'remove')}>
            <Icon name="trash" size={14} /> Remove
          </Button>
          <Button variant="soft" size="sm" onClick={() => resolveReport(r.id, 'dismiss')}>
            <Icon name="check" size={14} /> Dismiss
          </Button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'video', label: `Videos (${byType('video').length})` },
    { id: 'short', label: `Shorts (${byType('short').length})` },
    { id: 'comment', label: `Comments (${byType('comment').length})` },
    { id: 'user', label: `Users (${byType('user').length})` },
  ]

  const recentReports = db.reports.filter((r) => r.status !== 'open').slice(0, 5)
  const top = [...db.videos].sort((a, b) => b.views - a.views).slice(0, 3)
  const topCreator = [...db.users].filter((u) => u.isCreator).sort((a, b) => b.followers - a.followers)[0]

  return (
    <div className="page admin-page">
      <SectionHeader icon="chart" title="Admin dashboard"
        action={<span className="side-label"><Avatar user={me} size={22} /> {me.displayName}</span>} />

      <div className="admin-stats">
        <StatCard icon="users" label="Total users" value={fmtFull(db.users.length + 48120)} sub="+312 this week (demo)" />
        <StatCard icon="play" label="Total videos" value={fmtFull(db.videos.length)} />
        <StatCard icon="bolt" label="Total shorts" value={fmtFull(db.shorts.length)} />
        <StatCard icon="images" label="Total posts" value={fmtFull(db.posts.length)} />
        <StatCard icon="eye" label="Total views" value={fmt(totalViews)} sub="across videos & shorts" />
        <StatCard icon="flag" label="Open reports" value={openReports.length} sub={openReports.length ? 'Needs review' : 'All clear 🎉'} />
      </div>

      <SectionHeader icon="shield" title="Moderation queue" />
      <div className="seg seg-scroll" role="tablist" aria-label="Report type">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id}
            className={clsx('seg-item', tab === t.id && 'active')} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mod-list">
        {byType(tab).length === 0 ? (
          <EmptyState icon="check" title="Queue is clear" body={`No open ${tab} reports right now.`} />
        ) : (
          byType(tab).map((r) => <ReportRow key={r.id} r={r} />)
        )}
      </div>

      {recentReports.length > 0 && (
        <>
          <SectionHeader icon="clock" title="Recently resolved" />
          <div className="mod-list">
            {recentReports.map((r) => (
              <div key={r.id} className="mod-row resolved">
                <div className="mod-info">
                  <div className="mod-reason"><Icon name={r.status === 'removed' ? 'trash' : 'check'} size={15} /> {r.reason}</div>
                  <div className="v-sub">{r.type} · {r.status} · {timeAgo(r.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionHeader icon="flame" title="Platform snapshot" />
      <div className="admin-snapshot">
        <div className="snap-card">
          <div className="side-label">Top videos</div>
          {top.map((v, i) => (
            <div key={v.id} className="snap-row">
              <span className="snap-rank">#{i + 1}</span>
              <span className="snap-title">{v.title}</span>
              <span className="v-sub">{fmt(v.views)} views</span>
            </div>
          ))}
        </div>
        <div className="snap-card">
          <div className="side-label">Top creator</div>
          {topCreator && (
            <div className="snap-creator">
              <Avatar user={topCreator} size={48} ring />
              <div>
                <strong>{topCreator.displayName}</strong>
                <div className="v-sub">@{topCreator.username} · {fmt(topCreator.followers)} followers</div>
              </div>
            </div>
          )}
          <div className="side-label" style={{ marginTop: 16 }}>Storage note</div>
          <p className="muted small" style={{ margin: 0 }}>
            This dashboard reads from the local mock database. In production these endpoints
            would aggregate analytics and moderation queues from your backend.
          </p>
        </div>
      </div>
    </div>
  )
}
