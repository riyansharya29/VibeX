// Full-screen vertical Shorts experience — swipe/scroll between clips,
// autoplay the active one, tap to pause, action rail + comments sheet.
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../lib/icons'
import { clsx, fmt } from '../lib/format'
import { useStore, useDbUser } from '../store/useStore'
import { Avatar, EmptyState, BottomSheet, Verified, Button } from '../components/ui'
import { LikeButton, SaveButton, ShareButton, MoreMenu, FollowButton } from '../components/actions'
import Comments from '../components/Comments'

function ShortItem({ short, active }) {
  const videoRef = useRef(null)
  const safePlay = (el) => {
    try {
      const p = el?.play?.()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } catch { /* noop */ }
  }
  const creator = useDbUser(short.creatorId)
  const muted = useStore((s) => s.muted)
  const setMuted = useStore((s) => s.setMuted)
  const recordView = useStore((s) => s.recordView)
  const commentCount = useStore((s) =>
    s.db.comments.filter((c) => c.contentType === 'short' && c.contentId === short.id).length + (short.commentCount || 0)
  )
  const [paused, setPaused] = useState(false)
  const [flash, setFlash] = useState(null) // 'play' | 'pause'
  const [showComments, setShowComments] = useState(false)
  const [descOpen, setDescOpen] = useState(false)
  const viewed = useRef(false)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (active) {
      el.currentTime = 0
      safePlay(el)
      setPaused(false)
      if (!viewed.current) { viewed.current = true; recordView('short', short.id) }
    } else {
      el.pause()
    }
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (videoRef.current) videoRef.current.muted = muted }, [muted])

  const tap = () => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) { safePlay(el); setPaused(false); setFlash('play') }
    else { el.pause(); setPaused(true); setFlash('pause') }
    setTimeout(() => setFlash(null), 500)
  }

  if (!short) return null

  return (
    <div className="short-frame" data-short={short.id}>
      <div className="short-video-wrap">
        <video
          ref={videoRef}
          src={short.src}
          poster={short.poster}
          loop playsInline muted={muted}
          preload={active ? 'auto' : 'metadata'}
          onClick={tap}
          aria-label={short.caption}
        />
        {flash && (
          <div className="short-flash" aria-hidden="true">
            <Icon name={flash === 'play' ? 'play' : 'pause'} size={44} solid />
          </div>
        )}
        <button type="button" className="short-mute" onClick={() => setMuted(!muted)} aria-label={muted ? 'Unmute' : 'Mute'}>
          <Icon name={muted ? 'mute' : 'volume'} size={19} />
        </button>

        <div className="short-bottom">
          <div className="short-creator">
            <Link to={`/profile/${creator?.username}`} className="short-creator-link">
              <Avatar user={creator} size={36} ring />
              <span className="creator-name">@{creator?.username}{creator?.verified && <Verified size={13} />}</span>
            </Link>
            <FollowButton creator={creator} size="sm" />
          </div>
          <button type="button" className={clsx('short-caption', descOpen && 'open')} onClick={() => setDescOpen((v) => !v)}>
            {short.caption}
          </button>
          <div className="short-tags">
            {(short.hashtags || []).slice(0, 3).map((t) => (
              <Link key={t} to={`/search?q=%23${encodeURIComponent(t)}`} className="hashtag">#{t}</Link>
            ))}
          </div>
          <Link to={`/search?q=${encodeURIComponent(short.music || '')}`} className="music-pill">
            <Icon name="music" size={14} />
            <span className="music-marquee"><span>{short.music || 'original audio'}</span></span>
          </Link>
        </div>

        <div className="short-rail">
          <LikeButton type="short" id={short.id} size={26} />
          <button type="button" className="act" onClick={() => setShowComments(true)} aria-label="Comments">
            <span className="act-icon"><Icon name="comment" size={26} /></span>
            <span className="act-count">{fmt(commentCount)}</span>
          </button>
          <ShareButton type="short" id={short.id} title={short.caption} size={26} label={null} />
          <SaveButton type="short" id={short.id} size={26} label={false} />
          <MoreMenu type="short" id={short.id} title={short.caption} />
          <div className="short-views"><Icon name="eye" size={14} /> {fmt(short.views)}</div>
        </div>

        {paused && <div className="short-pausedlabel" aria-hidden="true"><Icon name="pause" size={16} /> Paused</div>}
      </div>

      {showComments && (
        <BottomSheet onClose={() => setShowComments(false)} title={`Comments · ${fmt(commentCount)}`}>
          <div className="sheet-comments">
            <Comments contentType="short" contentId={short.id} commentCount={commentCount} />
          </div>
        </BottomSheet>
      )}
    </div>
  )
}

export default function Shorts() {
  const { id } = useParams()
  const navigate = useNavigate()
  const db = useStore((s) => s.db)
  const notInterested = useStore((s) => s.notInterested)
  const containerRef = useRef(null)
  const [activeIdx, setActiveIdx] = useState(0)

  const shorts = db.shorts.filter((s) => !notInterested.includes(`short:${s.id}`))

  // Jump to a specific short when /shorts/:id is used.
  useEffect(() => {
    if (!id) return
    const idx = shorts.findIndex((s) => s.id === id)
    if (idx >= 0) {
      setActiveIdx(idx)
      const el = containerRef.current?.querySelectorAll('.short-frame')[idx]
      el?.scrollIntoView({ block: 'start', behavior: 'instant' })
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Track which frame is active (≥60% visible).
  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof IntersectionObserver === 'undefined') return
    const frames = container.querySelectorAll('.short-frame')
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            const idx = Array.from(frames).indexOf(en.target)
            if (idx >= 0) setActiveIdx(idx)
          }
        })
      },
      { root: container, threshold: 0.6 }
    )
    frames.forEach((f) => obs.observe(f))
    return () => obs.disconnect()
  }, [shorts.length])

  const scrollBy = (dir) => {
    const container = containerRef.current
    if (!container) return
    const next = Math.min(Math.max(activeIdx + dir, 0), shorts.length - 1)
    container.querySelectorAll('.short-frame')[next]?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); scrollBy(1) }
      if (e.key === 'ArrowUp') { e.preventDefault(); scrollBy(-1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (shorts.length === 0) {
    return (
      <div className="page">
        <EmptyState icon="bolt" title="No shorts available" body="New shorts will appear here soon.">
          <Button variant="primary" onClick={() => navigate('/')}>Back to home</Button>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="shorts-wrap">
      <div className="shorts-container" ref={containerRef} role="feed" aria-label="Shorts feed">
        {shorts.map((s, i) => (
          <ShortItem key={s.id} short={s} active={i === activeIdx} />
        ))}
      </div>
      <div className="shorts-arrows" aria-hidden="false">
        <button type="button" onClick={() => scrollBy(-1)} disabled={activeIdx === 0} aria-label="Previous short">
          <Icon name="chevU" size={20} />
        </button>
        <button type="button" onClick={() => scrollBy(1)} disabled={activeIdx === shorts.length - 1} aria-label="Next short">
          <Icon name="chevD" size={20} />
        </button>
      </div>
    </div>
  )
}
