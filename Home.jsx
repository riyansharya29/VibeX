// Home feed — personalized mix of videos, shorts rails and posts with
// category chips and load-more / infinite scroll.
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../lib/icons'
import { CATEGORIES } from '../config/brand'
import { clsx } from '../lib/format'
import { useStore } from '../store/useStore'
import { VideoCard, ShortsRail, PostCard } from '../components/cards'
import { SkeletonFeed, EmptyState, SectionHeader, Spinner } from '../components/ui'

const PAGE = 6

export default function Home() {
  const db = useStore((s) => s.db)
  const notInterested = useStore((s) => s.notInterested)
  const following = useStore((s) => s.following)
  const [chip, setChip] = useState('all')
  const [pages, setPages] = useState(1)
  const [booting, setBooting] = useState(true)
  const sentinel = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 650)
    return () => clearTimeout(t)
  }, [])

  const visible = (type, item) =>
    !notInterested.includes(`${type}:${item.id}`) &&
    (item.visibility === 'public' || item.creatorId === db.users.find((u) => u.id === 'u_demo')?.id || true)

  const videos = useMemo(() => {
    let list = db.videos.filter((v) => !notInterested.includes(`video:${v.id}`))
    if (chip === 'trending') list = [...list].sort((a, b) => b.views - a.views)
    else if (chip === 'following') list = list.filter((v) => following[v.creatorId])
    else if (chip !== 'all') list = list.filter((v) => v.category === chip)
    else list = [...list].sort((a, b) => b.createdAt - a.createdAt)
    return list
  }, [db.videos, chip, notInterested, following])

  const posts = useMemo(
    () => db.posts.filter((p) => !notInterested.includes(`post:${p.id}`)).sort((a, b) => b.createdAt - a.createdAt),
    [db.posts, notInterested]
  )
  const shorts = useMemo(
    () => [...db.shorts].sort((a, b) => b.views - a.views),
    [db.shorts]
  )
  void visible

  const chunks = []
  for (let i = 0; i < pages * PAGE && i < videos.length; i += PAGE) chunks.push(videos.slice(i, i + PAGE))
  const exhausted = pages * PAGE >= videos.length

  // Infinite scroll on the sentinel, with a fallback "Load more" button.
  useEffect(() => {
    const el = sentinel.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !exhausted) setPages((p) => p + 1) },
      { rootMargin: '800px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [exhausted])

  const chips = [
    { id: 'all', label: 'All' },
    { id: 'trending', label: 'Trending' },
    { id: 'following', label: 'Following' },
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
  ]

  return (
    <div className="page">
      <div className="chipbar" role="tablist" aria-label="Feed filters">
        {chips.map((c) => (
          <button key={c.id} type="button" role="tab" aria-selected={chip === c.id}
            className={clsx('chip', chip === c.id && 'active')} onClick={() => { setChip(c.id); setPages(1) }}>
            {c.label}
          </button>
        ))}
      </div>

      {booting ? (
        <SkeletonFeed count={6} />
      ) : videos.length === 0 ? (
        <EmptyState
          icon={chip === 'following' ? 'users' : 'search'}
          title={chip === 'following' ? 'No videos from people you follow' : 'Nothing here yet'}
          body={chip === 'following' ? 'Follow some creators and their new uploads will show up here.' : 'Try a different category.'}
        />
      ) : (
        <>
          {chunks.map((chunk, ci) => (
            <div key={ci}>
              <div className="grid-videos">
                {chunk.map((v) => <VideoCard key={v.id} video={v} />)}
              </div>
              {ci === 0 && chip === 'all' && <ShortsRail shorts={shorts} />}
              {ci === 1 && chip === 'all' && (
                <section className="feed-posts">
                  <SectionHeader icon="images" title="From the community" />
                  {posts.slice(0, 3).map((p) => <PostCard key={p.id} post={p} />)}
                </section>
              )}
            </div>
          ))}

          {!exhausted && (
            <div ref={sentinel} className="loadmore">
              <Spinner size={20} />
              <button type="button" className="btn btn-soft" onClick={() => setPages((p) => p + 1)}>Load more</button>
            </div>
          )}
          {exhausted && videos.length > 0 && (
            <div className="feed-end">
              <Icon name="check" size={18} /> You’re all caught up — {videos.length} videos
            </div>
          )}
        </>
      )}
    </div>
  )
}
