// Creator profile — cover, stats, tabs (Videos / Shorts / Posts / Saved[owner]).
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../lib/icons'
import { clsx, fmt, fmtFull, dateLabel } from '../lib/format'
import { useStore, useUser } from '../store/useStore'
import { VideoCard, ShortCard, PostCard } from '../components/cards'
import { Avatar, EmptyState, Verified, Button } from '../components/ui'
import { FollowButton } from '../components/actions'

const TABS = [
  { id: 'videos', label: 'Videos', icon: 'play' },
  { id: 'shorts', label: 'Shorts', icon: 'bolt' },
  { id: 'posts', label: 'Posts', icon: 'images' },
  { id: 'saved', label: 'Saved', icon: 'bookmark', ownerOnly: true },
]

export default function Profile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const me = useUser()
  const db = useStore((s) => s.db)
  const following = useStore((s) => s.following)
  const saved = useStore((s) => s.saved)
  const openShare = useStore((s) => s.openShare)
  const startConversation = useStore((s) => s.startConversation)
  const [tab, setTab] = useState('videos')

  const user = db.users.find((u) => u.username === username) || (!username && me) || null
  const isOwner = user && me && user.id === me.id

  const videos = useMemo(
    () => user ? db.videos.filter((v) => v.creatorId === user.id && (isOwner || v.visibility === 'public')).sort((a, b) => b.createdAt - a.createdAt) : [],
    [db.videos, user, isOwner]
  )
  const shorts = useMemo(
    () => user ? db.shorts.filter((s) => s.creatorId === user.id && (isOwner || s.visibility === 'public')).sort((a, b) => b.createdAt - a.createdAt) : [],
    [db.shorts, user, isOwner]
  )
  const posts = useMemo(
    () => user ? db.posts.filter((p) => p.creatorId === user.id && (isOwner || p.visibility === 'public')).sort((a, b) => b.createdAt - a.createdAt) : [],
    [db.posts, user, isOwner]
  )

  const totalViews = videos.reduce((a, v) => a + v.views, 0) + shorts.reduce((a, s) => a + s.views, 0)
  const totalLikes = videos.reduce((a, v) => a + v.likes, 0) + shorts.reduce((a, s) => a + s.likes, 0) + posts.reduce((a, p) => a + p.likes, 0)

  const savedItems = useMemo(() => {
    if (!isOwner) return { videos: [], shorts: [], posts: [] }
    const pick = (type, arr) => arr.filter((x) => saved[`${type}:${x.id}`])
    return { videos: pick('video', db.videos), shorts: pick('short', db.shorts), posts: pick('post', db.posts) }
  }, [saved, db, isOwner])

  if (!user) {
    return (
      <div className="page">
        <EmptyState icon="user" title="User not found" body={`No account named “${username}”.`}>
          <Button variant="primary" onClick={() => navigate('/')}>Back home</Button>
        </EmptyState>
      </div>
    )
  }

  const followerCount = Object.keys(following).length && following[user.id]
    ? user.followers // live value already in db
    : user.followers

  const message = () => {
    const id = startConversation(user.id)
    navigate(`/messages/${id}`)
  }

  const visibleTabs = TABS.filter((t) => !t.ownerOnly || isOwner)

  return (
    <div className="page profile-page">
      {/* Cover */}
      <div className="profile-cover" aria-hidden="true" />
      <div className="profile-head">
        <Avatar user={user} size={104} ring className="profile-avatar" />
        <div className="profile-id">
          <h1>{user.displayName}{user.verified && <Verified size={18} />}</h1>
          <div className="profile-uname">@{user.username}</div>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <div className="profile-joined"><Icon name="calendar" size={14} /> Joined {dateLabel(user.joined || Date.now())}</div>
        </div>
        <div className="profile-btns">
          {isOwner ? (
            <Button variant="soft" onClick={() => navigate('/settings')}><Icon name="edit" size={16} /> Edit profile</Button>
          ) : (
            <>
              <FollowButton creator={user} />
              <Button variant="soft" onClick={message}><Icon name="mail" size={16} /> Message</Button>
            </>
          )}
          <Button
            variant="soft"
            aria-label="Share profile"
            onClick={() => openShare({ type: 'video', id: user.username, title: `Check out @${user.username} on VibeX`, profile: true })}
          >
            <Icon name="share" size={16} /> Share
          </Button>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat"><strong>{fmtFull(followerCount)}</strong><span>Followers</span></div>
        <div className="stat"><strong>{fmtFull(user.following || 0)}</strong><span>Following</span></div>
        <div className="stat"><strong>{fmt(totalViews)}</strong><span>Total views</span></div>
        <div className="stat"><strong>{fmt(totalLikes)}</strong><span>Total likes</span></div>
      </div>

      <div className="tabs" role="tablist" aria-label="Profile content">
        {visibleTabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id}
            className={clsx('tab', tab === t.id && 'active')} onClick={() => setTab(t.id)}>
            <Icon name={t.icon} size={17} /><span>{t.label}</span>
            <span className="tab-count">
              {t.id === 'videos' ? videos.length : t.id === 'shorts' ? shorts.length :
               t.id === 'posts' ? posts.length : savedItems.videos.length + savedItems.shorts.length + savedItems.posts.length}
            </span>
          </button>
        ))}
      </div>

      <div className="profile-body">
        {tab === 'videos' && (
          videos.length ? (
            <div className="grid-videos">{videos.map((v) => <VideoCard key={v.id} video={v} hideCreator />)}</div>
          ) : (
            <EmptyState icon="play" title="No videos yet"
              body={isOwner ? 'Upload your first video and it will live here.' : `${user.displayName} hasn’t posted any videos yet.`}>
              {isOwner && <Button variant="primary" onClick={() => useStore.getState().openUpload('video')}><Icon name="upload" size={16} /> Upload video</Button>}
            </EmptyState>
          )
        )}
        {tab === 'shorts' && (
          shorts.length ? (
            <div className="grid-shorts">{shorts.map((s) => <ShortCard key={s.id} short={s} />)}</div>
          ) : (
            <EmptyState icon="bolt" title="No shorts yet"
              body={isOwner ? 'Share a quick vertical clip — it only takes a minute.' : 'Nothing here… yet.'}>
              {isOwner && <Button variant="primary" onClick={() => useStore.getState().openUpload('short')}><Icon name="bolt" size={16} /> Upload short</Button>}
            </EmptyState>
          )
        )}
        {tab === 'posts' && (
          posts.length ? (
            <div className="feed-posts">{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>
          ) : (
            <EmptyState icon="images" title="No posts yet"
              body={isOwner ? 'Post a photo, carousel or text update for your followers.' : 'No posts to show.'}>
              {isOwner && <Button variant="primary" onClick={() => useStore.getState().openUpload('post')}><Icon name="images" size={16} /> Create post</Button>}
            </EmptyState>
          )
        )}
        {tab === 'saved' && isOwner && (
          <>
            {savedItems.videos.length + savedItems.shorts.length + savedItems.posts.length === 0 ? (
              <EmptyState icon="bookmark" title="Nothing saved yet"
                body="Tap the bookmark on any video, short or post to keep it here. Only you can see this.">
                <Link to="/explore" className="btn btn-primary"><Icon name="compass" size={16} /> Explore content</Link>
              </EmptyState>
            ) : (
              <>
                {savedItems.videos.length > 0 && (
                  <><div className="side-label">Videos</div>
                    <div className="grid-videos">{savedItems.videos.map((v) => <VideoCard key={v.id} video={v} />)}</div></>
                )}
                {savedItems.shorts.length > 0 && (
                  <><div className="side-label">Shorts</div>
                    <div className="grid-shorts">{savedItems.shorts.map((s) => <ShortCard key={s.id} short={s} />)}</div></>
                )}
                {savedItems.posts.length > 0 && (
                  <><div className="side-label">Posts</div>
                    <div className="feed-posts">{savedItems.posts.map((p) => <PostCard key={p.id} post={p} />)}</div></>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
