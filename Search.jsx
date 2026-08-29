// Search — suggestions, recent/trending, results across videos, shorts,
// creators + hashtags, with type tabs and Latest/Popular filters.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../lib/icons'
import { clsx, fmt, timeAgo } from '../lib/format'
import { useStore } from '../store/useStore'
import { useDebounced } from '../hooks'
import { VideoRow, ShortCard, PostCard } from '../components/cards'
import { Avatar, EmptyState, Verified, Button } from '../components/ui'
import { FollowButton } from '../components/actions'
import { TRENDING_SEARCHES } from '../data/seed'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'video', label: 'Videos' },
  { id: 'short', label: 'Shorts' },
  { id: 'creator', label: 'Creators' },
]

export default function Search() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const q = params.get('q') || ''
  const [input, setInput] = useState(q)
  const debounced = useDebounced(input, 300)
  const [tab, setTab] = useState('all')
  const [sort, setSort] = useState('popular') // popular | latest
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  const db = useStore((s) => s.db)
  const notInterested = useStore((s) => s.notInterested)
  const recent = useStore((s) => s.recentSearches)
  const addRecent = useStore((s) => s.addRecentSearch)
  const clearRecent = useStore((s) => s.clearRecentSearches)

  useEffect(() => { setInput(q) }, [q])
  useEffect(() => { inputRef.current?.focus() }, [])

  const run = (term) => {
    const t = term.trim()
    setParams(t ? { q: t } : {})
    if (t) addRecent(t)
    setFocused(false)
  }

  const norm = (s) => (s || '').toLowerCase()
  const isTag = q.startsWith('#')
  const needle = norm(q.replace(/^#/, ''))

  const matchCreator = (u) =>
    norm(u.username).includes(needle) || norm(u.displayName).includes(needle)

  const results = useMemo(() => {
    if (!needle) return null
    const creators = db.users.filter(matchCreator)
    let videos = db.videos.filter((v) =>
      !notInterested.includes(`video:${v.id}`) &&
      (norm(v.title).includes(needle) || norm(v.description).includes(needle) ||
        (v.tags || []).some((t) => norm(t).includes(needle)) ||
        (v.hashtags || []).some((t) => norm(t).includes(needle)) ||
        matchCreator(db.users.find((u) => u.id === v.creatorId) || {}))
    )
    let shorts = db.shorts.filter((s) =>
      !notInterested.includes(`short:${s.id}`) &&
      (norm(s.caption).includes(needle) || norm(s.music).includes(needle) ||
        (s.hashtags || []).some((t) => norm(t).includes(needle)))
    )
    const posts = db.posts.filter((p) =>
      !notInterested.includes(`post:${p.id}`) &&
      (norm(p.caption).includes(needle) || (p.hashtags || []).some((t) => norm(t).includes(needle)))
    )
    if (isTag) videos = videos.filter((v) => (v.hashtags || []).some((t) => norm(t).includes(needle)))
    videos = [...videos].sort(sort === 'latest' ? (a, b) => b.createdAt - a.createdAt : (a, b) => b.views - a.views)
    shorts = [...shorts].sort(sort === 'latest' ? (a, b) => b.createdAt - a.createdAt : (a, b) => b.views - a.views)
    return { creators, videos, shorts, posts }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needle, db, tab, sort, notInterested])

  // Live suggestions while typing (before submit)
  const suggestions = useMemo(() => {
    const n = norm(debounced)
    if (n.length < 2) return []
    const nameHits = db.users
      .filter((u) => norm(u.username).includes(n) || norm(u.displayName).includes(n))
      .slice(0, 3)
      .map((u) => ({ kind: 'creator', label: u.displayName, sub: `@${u.username}`, icon: 'user', to: `/profile/${u.username}` }))
    const titleHits = db.videos
      .filter((v) => norm(v.title).includes(n))
      .slice(0, 4)
      .map((v) => ({ kind: 'video', label: v.title, sub: `${fmt(v.views)} views`, icon: 'play', term: v.title }))
    const tagHits = Object.keys(
      db.shorts.reduce((acc, s) => { (s.hashtags || []).forEach((t) => { acc[t] = 1 }); return acc }, {})
    )
      .filter((t) => norm(t).includes(n))
      .slice(0, 3)
      .map((t) => ({ kind: 'tag', label: `#${t}`, icon: 'flame', term: `#${t}` }))
    return [...nameHits, ...titleHits, ...tagHits].slice(0, 8)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, db])

  const showPanel = focused && !q

  const totalResults = results
    ? results.creators.length + results.videos.length + results.shorts.length + results.posts.length
    : 0

  return (
    <div className="page search-page">
      <form className="searchbar" onSubmit={(e) => { e.preventDefault(); run(input) }} role="search">
        <Icon name="search" size={19} />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => e.key === 'Enter' && run(input)}
          placeholder="Search videos, shorts, creators, #hashtags"
          aria-label="Search"
          autoComplete="off"
        />
        {input && (
          <button type="button" className="iconbtn" aria-label="Clear search" onClick={() => { setInput(''); setParams({}); inputRef.current?.focus() }}>
            <Icon name="x" size={18} />
          </button>
        )}
      </form>

      {/* Suggestion panel */}
      {showPanel && (
        <div className="search-panel">
          {input.length >= 2 && suggestions.length > 0 ? (
            <>
              <div className="side-label">Suggestions</div>
              {suggestions.map((s, i) => (
                <button key={i} type="button" className="suggest-item"
                  onClick={() => (s.to ? navigate(s.to) : run(s.term || s.label))}>
                  <Icon name={s.icon} size={17} />
                  <span className="suggest-label">
                    {s.label}
                    {s.sub && <small>{s.sub}</small>}
                  </span>
                </button>
              ))}
            </>
          ) : (
            <>
              {recent.length > 0 && (
                <>
                  <div className="search-panel-head">
                    <div className="side-label">Recent searches</div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={clearRecent}>Clear</button>
                  </div>
                  {recent.map((r) => (
                    <button key={r} type="button" className="suggest-item" onClick={() => { setInput(r); run(r) }}>
                      <Icon name="clock" size={17} /><span className="suggest-label">{r}</span>
                    </button>
                  ))}
                </>
              )}
              <div className="side-label">Trending searches</div>
              <div className="tagcloud pad">
                {TRENDING_SEARCHES.map((t) => (
                  <button key={t} type="button" className="tagchip" onClick={() => { setInput(t); run(t) }}>
                    <Icon name="flame" size={13} /> {t}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Results */}
      {q && results && (
        <>
          <div className="search-toolbar">
            <div className="seg seg-scroll" role="tablist" aria-label="Result type">
              {TABS.map((t) => (
                <button key={t.id} type="button" role="tab" aria-selected={tab === t.id}
                  className={clsx('seg-item', tab === t.id && 'active')} onClick={() => setTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
            <label className="sort-select">
              <Icon name="filter" size={15} />
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort results">
                <option value="popular">Popular</option>
                <option value="latest">Latest</option>
              </select>
            </label>
          </div>

          <p className="search-count">{totalResults} result{totalResults === 1 ? '' : 's'} for “{q}”</p>

          {totalResults === 0 ? (
            <EmptyState icon="search" title="No results found"
              body="Try different keywords, or check the trending searches.">
              <Button variant="soft" onClick={() => { setInput(''); setParams({}) }}>Clear search</Button>
            </EmptyState>
          ) : (
            <div className="search-results">
              {(tab === 'all' || tab === 'creator') && results.creators.length > 0 && (
                <section className="search-section">
                  <div className="side-label">Creators</div>
                  <div className="creator-rows">
                    {results.creators.slice(0, tab === 'creator' ? 20 : 4).map((u) => (
                      <div key={u.id} className="creator-row">
                        <Link to={`/profile/${u.username}`} className="creator-row-main">
                          <Avatar user={u} size={46} />
                          <div>
                            <div className="creator-name">{u.displayName}{u.verified && <Verified size={13} />}</div>
                            <div className="v-sub">@{u.username} · {fmt(u.followers)} followers</div>
                            {u.bio && <div className="creator-bio">{u.bio}</div>}
                          </div>
                        </Link>
                        <FollowButton creator={u} size="sm" />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(tab === 'all' || tab === 'video') && results.videos.length > 0 && (
                <section className="search-section">
                  <div className="side-label">Videos</div>
                  {results.videos.slice(0, tab === 'video' ? 30 : 6).map((v) => <VideoRow key={v.id} video={v} />)}
                </section>
              )}

              {(tab === 'all' || tab === 'short') && results.shorts.length > 0 && (
                <section className="search-section">
                  <div className="side-label">Shorts</div>
                  <div className="grid-shorts">
                    {results.shorts.slice(0, tab === 'short' ? 24 : 8).map((s) => <ShortCard key={s.id} short={s} />)}
                  </div>
                </section>
              )}

              {tab === 'all' && results.posts.length > 0 && (
                <section className="search-section">
                  <div className="side-label">Posts</div>
                  <div className="feed-posts">
                    {results.posts.slice(0, 4).map((p) => <PostCard key={p.id} post={p} />)}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}

      {!q && !showPanel && (
        <div className="search-idle">
          <Icon name="search" size={40} className="search-idle-icon" />
          <p>Search creators, videos, shorts and hashtags</p>
          <div className="tagcloud center">
            {TRENDING_SEARCHES.slice(0, 5).map((t) => (
              <button key={t} type="button" className="tagchip" onClick={() => { setInput(t); run(t) }}>
                <Icon name="flame" size={13} /> {t}
              </button>
            ))}
          </div>
          <p className="muted small"><Icon name="clock" size={13} /> Updated {timeAgo(Date.now() - 3600e3)}</p>
        </div>
      )}
    </div>
  )
}
