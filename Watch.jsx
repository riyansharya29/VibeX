// Long-form watch page: player, meta, actions, description, comments, up-next.
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../lib/icons'
import { clsx, fmt, fmtFull, timeAgo, dateLabel } from '../lib/format'
import { useStore, useDbUser } from '../store/useStore'
import Player from '../components/Player'
import Comments from '../components/Comments'
import { VideoRow } from '../components/cards'
import { Avatar, EmptyState, Verified, Button, PageLoader } from '../components/ui'
import { LikeButton, DislikeButton, SaveButton, ShareButton, MoreMenu, FollowButton } from '../components/actions'

export default function Watch() {
  const { id } = useParams()
  const navigate = useNavigate()
  const video = useStore((s) => s.db.videos.find((v) => v.id === id))
  const creator = useDbUser(video?.creatorId)
  const recordView = useStore((s) => s.recordView)
  const db = useStore((s) => s.db)
  const notInterested = useStore((s) => s.notInterested)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 250)
    if (video) recordView('video', video.id)
    setExpanded(false)
    return () => clearTimeout(t)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!video) {
    return (
      <div className="page">
        <EmptyState icon="flag" title="This video isn’t available"
          body="It may have been removed, or the link is wrong.">
          <Button variant="primary" onClick={() => navigate('/')}>Back to home</Button>
        </EmptyState>
      </div>
    )
  }

  const upNext = db.videos
    .filter((v) => v.id !== video.id && !notInterested.includes(`video:${v.id}`))
    .sort((a, b) => (b.category === video.category) - (a.category === video.category) || b.views - a.views)
    .slice(0, 12)

  const commentCount = db.comments.filter((c) => c.contentType === 'video' && c.contentId === video.id).length + (video.commentCount || 0)

  if (loading) return <PageLoader />

  return (
    <div className="page watch">
      <div className="watch-main">
        <Player src={video.src} poster={video.poster} title={video.title} autoPlay />

        <h1 className="watch-title">{video.title}</h1>

        <div className="watch-row">
          <div className="watch-creator">
            <Link to={`/profile/${creator?.username}`}><Avatar user={creator} size={42} /></Link>
            <div className="wc-meta">
              <Link to={`/profile/${creator?.username}`} className="creator-name">
                {creator?.displayName}{creator?.verified && <Verified />}
              </Link>
              <span className="v-sub">{fmt(creator?.followers || 0)} followers</span>
            </div>
            <FollowButton creator={creator} />
          </div>
          <div className="watch-actions">
            <div className="likepair">
              <LikeButton type="video" id={video.id} size={21} row />
              <span className="likepair-sep" />
              <DislikeButton type="video" id={video.id} size={21} />
            </div>
            <ShareButton type="video" id={video.id} title={video.title} />
            <SaveButton type="video" id={video.id} />
            <MoreMenu type="video" id={video.id} title={video.title} />
          </div>
        </div>

        <div className={clsx('watch-desc', expanded && 'expanded')}>
          <div className="watch-desc-head">
            <strong>{fmtFull(video.views)} views</strong>
            <span className="dot-sep">·</span>
            <span title={dateLabel(video.createdAt)}>{timeAgo(video.createdAt)}</span>
            {(video.hashtags || []).slice(0, 4).map((t) => (
              <Link key={t} to={`/search?q=%23${encodeURIComponent(t)}`} className="hashtag">#{t}</Link>
            ))}
          </div>
          <p className="watch-desc-text">{video.description}</p>
          <button type="button" className="watch-desc-toggle" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Show less' : '…more'}
          </button>
        </div>

        <Comments contentType="video" contentId={video.id} commentCount={commentCount} />
      </div>

      <aside className="watch-side">
        <div className="side-label"><Icon name="flame" size={16} /> Up next</div>
        {upNext.map((v) => <VideoRow key={v.id} video={v} dense />)}
        {upNext.length === 0 && <EmptyState icon="search" title="Nothing else to show" body="Check back later for more videos." />}
      </aside>
    </div>
  )
}
