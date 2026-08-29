// Library / History / Saved collection pages.
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../lib/icons'
import { clsx } from '../lib/format'
import { useStore, useUser } from '../store/useStore'
import { VideoCard, VideoRow, ShortCard, PostCard } from '../components/cards'
import { EmptyState, SectionHeader, Button } from '../components/ui'

// ── Library ────────────────────────────────────────────────────
export function Library() {
  const db = useStore((s) => s.db)
  const history = useStore((s) => s.history)
  const saved = useStore((s) => s.saved)
  const liked = useStore((s) => s.liked)
  const me = useUser()
  const navigate = useNavigate()

  const histIds = Object.entries(history).sort((a, b) => b[1] - a[1]).map(([id]) => id)
  const histVideos = histIds.map((id) => db.videos.find((v) => v.id === id)).filter(Boolean).slice(0, 6)
  const savedVideos = db.videos.filter((v) => saved[`video:${v.id}`]).slice(0, 6)
  const likedVideos = db.videos.filter((v) => liked[`video:${v.id}`]).slice(0, 6)
  const myUploads = db.videos.filter((v) => v.creatorId === me?.id)

  const Row = ({ icon, title, to, videos, empty }) => (
    <section className="lib-section">
      <SectionHeader icon={icon} title={title} action={<Link to={to} className="rail-more">See all</Link>} />
      {videos.length === 0 ? (
        <p className="lib-empty">{empty}</p>
      ) : (
        <div className="rail-videos">
          {videos.map((v) => (
            <div key={v.id} className="rail-video-item"><VideoCard video={v} /></div>
          ))}
        </div>
      )}
    </section>
  )

  return (
    <div className="page library-page">
      <div className="lib-quick">
        <button type="button" className="lib-quick-item" onClick={() => navigate('/history')}>
          <Icon name="clock" size={22} /><span>History</span><strong>{histIds.length}</strong>
        </button>
        <button type="button" className="lib-quick-item" onClick={() => navigate('/saved')}>
          <Icon name="bookmark" size={22} /><span>Saved</span><strong>{Object.values(saved).filter(Boolean).length}</strong>
        </button>
        <button type="button" className="lib-quick-item" onClick={() => me && navigate(`/profile/${me.username}`)}>
          <Icon name="user" size={22} /><span>Your content</span><strong>{myUploads.length}</strong>
        </button>
      </div>
      <Row icon="clock" title="Watch history" to="/history" videos={histVideos} empty="Videos you watch will show up here." />
      <Row icon="bookmark" title="Saved videos" to="/saved" videos={savedVideos} empty="Save videos to find them again fast." />
      <Row icon="heart" title="Liked videos" to="/saved" videos={likedVideos} empty="Videos you like are collected here." />
      {myUploads.length > 0 && (
        <Row icon="upload" title="Your uploads" to={`/profile/${me.username}`} videos={myUploads} empty="" />
      )}
    </div>
  )
}

// ── History ────────────────────────────────────────────────────
export function History() {
  const db = useStore((s) => s.db)
  const history = useStore((s) => s.history)
  const clearHistory = useStore((s) => s.clearHistory)

  const videos = Object.entries(history)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => db.videos.find((v) => v.id === id))
    .filter(Boolean)

  return (
    <div className="page">
      <SectionHeader
        icon="clock" title="Watch history"
        action={videos.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearHistory}><Icon name="trash" size={15} /> Clear all</Button>
        )}
      />
      {videos.length === 0 ? (
        <EmptyState icon="clock" title="No watch history"
          body="Videos you watch will appear here so you can find them again.">
          <Link to="/" className="btn btn-primary"><Icon name="home" size={16} /> Watch something</Link>
        </EmptyState>
      ) : (
        <div className="list-videos">{videos.map((v) => <VideoRow key={v.id} video={v} />)}</div>
      )}
    </div>
  )
}

// ── Saved ──────────────────────────────────────────────────────
export function Saved() {
  const db = useStore((s) => s.db)
  const saved = useStore((s) => s.saved)
  const [tab, setTab] = useState('all')

  const videos = useMemo(() => db.videos.filter((v) => saved[`video:${v.id}`]), [db.videos, saved])
  const shorts = useMemo(() => db.shorts.filter((s) => saved[`short:${s.id}`]), [db.shorts, saved])
  const posts = useMemo(() => db.posts.filter((p) => saved[`post:${p.id}`]), [db.posts, saved])
  const total = videos.length + shorts.length + posts.length

  const tabs = [
    { id: 'all', label: `All (${total})` },
    { id: 'video', label: `Videos (${videos.length})` },
    { id: 'short', label: `Shorts (${shorts.length})` },
    { id: 'post', label: `Posts (${posts.length})` },
  ]

  return (
    <div className="page">
      <SectionHeader icon="bookmark" title="Saved" />
      {total === 0 ? (
        <EmptyState icon="bookmark" title="No saved items"
          body="Your saved videos, shorts and posts live here — private to you.">
          <Link to="/explore" className="btn btn-primary"><Icon name="compass" size={16} /> Find something to save</Link>
        </EmptyState>
      ) : (
        <>
          <div className="seg seg-scroll">
            {tabs.map((t) => (
              <button key={t.id} type="button" className={clsx('seg-item', tab === t.id && 'active')} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          {(tab === 'all' || tab === 'video') && videos.length > 0 && (
            <><div className="side-label">Videos</div>
              <div className="grid-videos">{videos.map((v) => <VideoCard key={v.id} video={v} />)}</div></>
          )}
          {(tab === 'all' || tab === 'short') && shorts.length > 0 && (
            <><div className="side-label">Shorts</div>
              <div className="grid-shorts">{shorts.map((s) => <ShortCard key={s.id} short={s} />)}</div></>
          )}
          {(tab === 'all' || tab === 'post') && posts.length > 0 && (
            <><div className="side-label">Posts</div>
              <div className="feed-posts">{posts.map((p) => <PostCard key={p.id} post={p} />)}</div></>
          )}
        </>
      )}
    </div>
  )
}
