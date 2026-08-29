// Following feed — latest from creators you follow, plus follow suggestions.
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../lib/icons'
import { useStore } from '../store/useStore'
import { VideoCard, ShortsRail } from '../components/cards'
import { Avatar, EmptyState, SectionHeader, Verified } from '../components/ui'
import { FollowButton } from '../components/actions'

export default function Following() {
  const db = useStore((s) => s.db)
  const following = useStore((s) => s.following)

  const followedIds = Object.keys(following).filter((k) => following[k])
  const videos = useMemo(
    () => db.videos.filter((v) => followedIds.includes(v.creatorId) && v.visibility === 'public')
      .sort((a, b) => b.createdAt - a.createdAt),
    [db.videos, followedIds.join(',')] // eslint-disable-line
  )
  const shorts = useMemo(
    () => db.shorts.filter((s) => followedIds.includes(s.creatorId)).sort((a, b) => b.createdAt - a.createdAt),
    [db.shorts, followedIds.join(',')] // eslint-disable-line
  )
  const suggestions = db.users.filter((u) => u.isCreator && !following[u.id]).slice(0, 6)

  if (followedIds.length === 0) {
    return (
      <div className="page">
        <SectionHeader icon="users" title="Following" />
        <EmptyState icon="users" title="You’re not following anyone yet"
          body="Follow creators to get their newest videos and shorts here.">
          <Link to="/explore" className="btn btn-primary"><Icon name="compass" size={16} /> Discover creators</Link>
        </EmptyState>
        <SectionHeader icon="flame" title="Suggested for you" />
        <div className="creator-rows">
          {suggestions.map((u) => (
            <div key={u.id} className="creator-row">
              <Link to={`/profile/${u.username}`} className="creator-row-main">
                <Avatar user={u} size={46} />
                <div>
                  <div className="creator-name">{u.displayName}{u.verified && <Verified size={13} />}</div>
                  <div className="v-sub">@{u.username}</div>
                  <div className="creator-bio">{u.bio}</div>
                </div>
              </Link>
              <FollowButton creator={u} size="sm" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <SectionHeader icon="users" title={`Latest from ${followedIds.length} creator${followedIds.length > 1 ? 's' : ''} you follow`} />
      {videos.length === 0 && shorts.length === 0 ? (
        <EmptyState icon="clock" title="All caught up" body="No new uploads from the people you follow." />
      ) : (
        <>
          <div className="grid-videos">{videos.slice(0, 8).map((v) => <VideoCard key={v.id} video={v} />)}</div>
          {shorts.length > 0 && <ShortsRail shorts={shorts} />}
        </>
      )}
      <SectionHeader icon="compass" title="Creators you might like" />
      <div className="creator-rows">
        {suggestions.map((u) => (
          <div key={u.id} className="creator-row">
            <Link to={`/profile/${u.username}`} className="creator-row-main">
              <Avatar user={u} size={46} />
              <div>
                <div className="creator-name">{u.displayName}{u.verified && <Verified size={13} />}</div>
                <div className="v-sub">@{u.username}</div>
              </div>
            </Link>
            <FollowButton creator={u} size="sm" />
          </div>
        ))}
      </div>
    </div>
  )
}
