// Content cards: video grid card, video row, short card, post card, rails.
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../lib/icons'
import { clsx, fmt, fmtDuration, timeAgo } from '../lib/format'
import { useStore, useDbUser } from '../store/useStore'
import Thumb from './Thumb'
import { Avatar, Verified } from './ui'
import { LikeButton, SaveButton, ShareButton, MoreMenu, FollowButton } from './actions'
import Comments from './Comments'
import { useState } from 'react'
import { svgThumb } from '../lib/media'

// ── Video card (grid) ──────────────────────────────────────────
export function VideoCard({ video, hideCreator = false }) {
  const creator = useDbUser(video.creatorId)
  const navigate = useNavigate()
  const open = () => navigate(`/watch/${video.id}`)
  return (
    <article className="vcard">
      <button type="button" className="v-thumb" onClick={open} aria-label={`Watch: ${video.title}`}>
        <Thumb src={video.poster} title={video.title} category={video.category} className="v-img" />
        <span className="v-duration">{fmtDuration(video.duration)}</span>
        <span className="v-playhover"><Icon name="play" size={30} solid /></span>
      </button>
      <div className="v-meta">
        {!hideCreator && (
          <Link to={`/profile/${creator?.username}`} aria-label={creator?.displayName}>
            <Avatar user={creator} size={38} />
          </Link>
        )}
        <div className="v-text">
          <button type="button" className="v-title" onClick={open}>{video.title}</button>
          {!hideCreator && (
            <Link to={`/profile/${creator?.username}`} className="v-creator">
              {creator?.displayName}{creator?.verified && <Verified size={13} />}
            </Link>
          )}
          <div className="v-sub">
            <Icon name="eye" size={13} /> {fmt(video.views)} views <span className="dot-sep">·</span> {timeAgo(video.createdAt)}
          </div>
        </div>
        <MoreMenu type="video" id={video.id} title={video.title} />
      </div>
    </article>
  )
}

// ── Video row (search results, history, watch sidebar) ─────────
export function VideoRow({ video, onClick, dense = false }) {
  const creator = useDbUser(video.creatorId)
  const navigate = useNavigate()
  const open = (e) => {
    if (onClick) { e.preventDefault(); onClick() }
    navigate(`/watch/${video.id}`)
  }
  return (
    <article className={clsx('vrow', dense && 'dense')}>
      <button type="button" className="vrow-thumb" onClick={open} aria-label={`Watch: ${video.title}`}>
        <Thumb src={video.poster} title={video.title} category={video.category} className="v-img" />
        <span className="v-duration">{fmtDuration(video.duration)}</span>
      </button>
      <div className="vrow-info">
        <button type="button" className="vrow-title" onClick={open}>{video.title}</button>
        <Link to={`/profile/${creator?.username}`} className="v-creator">
          {creator?.displayName}{creator?.verified && <Verified size={13} />}
        </Link>
        <div className="v-sub">{fmt(video.views)} views <span className="dot-sep">·</span> {timeAgo(video.createdAt)}</div>
      </div>
      <MoreMenu type="video" id={video.id} title={video.title} />
    </article>
  )
}

// ── Short card (rail + grid) ───────────────────────────────────
export function ShortCard({ short }) {
  return (
    <Link to={`/shorts/${short.id}`} className="shortcard" aria-label={`Short: ${short.caption}`}>
      <Thumb src={short.poster} title={short.caption} category="entertainment" vertical className="v-img" />
      <span className="shortcard-views"><Icon name="bolt" size={13} /> {fmt(short.views)}</span>
      <p className="shortcard-cap">{short.caption}</p>
    </Link>
  )
}

// ── Horizontal shorts rail ─────────────────────────────────────
export function ShortsRail({ shorts, limit = 10 }) {
  if (!shorts.length) return null
  return (
    <section className="rail-section">
      <div className="rail-head">
        <span className="rail-logo"><Icon name="bolt" size={18} solid /></span>
        <h2>Shorts</h2>
        <Link to="/shorts" className="rail-more">View all</Link>
      </div>
      <div className="rail-shorts">
        {shorts.slice(0, limit).map((s) => <ShortCard key={s.id} short={s} />)}
      </div>
    </section>
  )
}

// ── Creator card (explore / search) ────────────────────────────
export function CreatorCard({ user, style }) {
  return (
    <div className="creator-card" style={style}>
      <Link to={`/profile/${user.username}`} className="creator-top">
        <Avatar user={user} size={64} ring />
        <div className="creator-name">{user.displayName}{user.verified && <Verified />}</div>
        <div className="creator-uname">@{user.username}</div>
        <div className="creator-stats">{fmt(user.followers)} followers</div>
      </Link>
      <FollowButton creator={user} size="sm" block />
    </div>
  )
}

// ── Post card (image / carousel / text) ────────────────────────
export function PostCard({ post }) {
  const creator = useDbUser(post.creatorId)
  const [slide, setSlide] = useState(0)
  const [showComments, setShowComments] = useState(false)
  const commentCount = useStore((s) =>
    s.db.comments.filter((c) => c.contentType === 'post' && c.contentId === post.id).length + (post.commentCount || 0)
  )
  const media = post.media || []
  const isCarousel = post.type === 'carousel' && media.length > 1

  return (
    <article className="postcard">
      <header className="postcard-head">
        <Link to={`/profile/${creator?.username}`} className="postcard-user">
          <Avatar user={creator} size={38} />
          <div>
            <div className="creator-name">{creator?.displayName}{creator?.verified && <Verified size={13} />}</div>
            <div className="v-sub">@{creator?.username} <span className="dot-sep">·</span> {timeAgo(post.createdAt)}</div>
          </div>
        </Link>
        <MoreMenu type="post" id={post.id} title={post.caption.slice(0, 40)} />
      </header>

      {post.type === 'text' ? (
        <p className="postcard-text">{post.caption}</p>
      ) : (
        <div className="postcard-media">
          {isCarousel ? (
            <div className="carousel">
              <div className="carousel-track" style={{ transform: `translateX(-${slide * 100}%)` }}>
                {media.map((m, i) => (
                  <Thumb key={i} src={m} title={post.caption} category="vlogs" className="carousel-img" />
                ))}
              </div>
              <div className="carousel-ui">
                {slide > 0 && (
                  <button type="button" className="carousel-btn left" onClick={() => setSlide(slide - 1)} aria-label="Previous image">
                    <Icon name="chevL" size={18} />
                  </button>
                )}
                {slide < media.length - 1 && (
                  <button type="button" className="carousel-btn right" onClick={() => setSlide(slide + 1)} aria-label="Next image">
                    <Icon name="chevR" size={18} />
                  </button>
                )}
                <div className="carousel-dots">
                  {media.map((_, i) => <span key={i} className={clsx('cdot', i === slide && 'on')} />)}
                </div>
                <span className="carousel-count"><Icon name="images" size={13} /> {slide + 1}/{media.length}</span>
              </div>
            </div>
          ) : (
            <Thumb src={media[0] || svgThumb(post.caption)} title={post.caption} category="vlogs" className="postcard-img" />
          )}
          <p className="postcard-cap">{post.caption}</p>
        </div>
      )}

      <div className="postcard-actions">
        <LikeButton type="post" id={post.id} row />
        <button type="button" className={clsx('act act-row', showComments && 'on-blue')} onClick={() => setShowComments((v) => !v)}>
          <span className="act-icon"><Icon name="comment" size={21} /></span>
          <span className="act-count">{fmt(commentCount)}</span>
        </button>
        <ShareButton type="post" id={post.id} title={post.caption.slice(0, 60)} label={null} />
        <span className="spacer" />
        <SaveButton type="post" id={post.id} label={false} />
      </div>

      {showComments && <Comments contentType="post" contentId={post.id} commentCount={commentCount} />}
    </article>
  )
}
