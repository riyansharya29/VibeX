// Explore — trending videos, categories, hashtags, creators, trending shorts.
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../lib/icons'
import { CATEGORIES } from '../config/brand'
import { fmt } from '../lib/format'
import { useStore } from '../store/useStore'
import { VideoCard, ShortsRail, CreatorCard } from '../components/cards'
import Thumb from '../components/Thumb'
import { SectionHeader } from '../components/ui'
import { TRENDING_SEARCHES } from '../data/seed'

export default function Explore() {
  const db = useStore((s) => s.db)
  const notInterested = useStore((s) => s.notInterested)
  const navigate = useNavigate()

  const trending = [...db.videos]
    .filter((v) => !notInterested.includes(`video:${v.id}`))
    .sort((a, b) => b.views - a.views)
  const hero = trending.slice(0, 5)
  const rest = trending.slice(5, 11)
  const topShorts = [...db.shorts].sort((a, b) => b.views - a.views).slice(0, 10)
  const creators = [...db.users].filter((u) => u.isCreator).sort((a, b) => b.followers - a.followers)

  const hashtagCounts = {}
  db.shorts.forEach((s) => (s.hashtags || []).forEach((t) => { hashtagCounts[t] = (hashtagCounts[t] || 0) + 1 }))
  db.videos.forEach((v) => (v.hashtags || []).forEach((t) => { hashtagCounts[t] = (hashtagCounts[t] || 0) + 1 }))
  const hashtags = Object.entries(hashtagCounts).sort((a, b) => b[1] - a[1]).slice(0, 14)

  const catThumb = (catId) => db.videos.find((v) => v.category === catId)?.poster

  return (
    <div className="page">
      <SectionHeader icon="flame" title="Trending now" />

      {/* Hero mosaic: 1 large + 4 small */}
      <div className="trend-mosaic">
        {hero[0] && (
          <Link to={`/watch/${hero[0].id}`} className="trend-hero">
            <Thumb src={hero[0].poster} title={hero[0].title} category={hero[0].category} className="v-img" />
            <div className="trend-info">
              <span className="trend-rank">#1 Trending</span>
              <strong>{hero[0].title}</strong>
              <span className="trend-sub">{fmt(hero[0].views)} views</span>
            </div>
          </Link>
        )}
        <div className="trend-side">
          {hero.slice(1, 5).map((v, i) => (
            <Link key={v.id} to={`/watch/${v.id}`} className="trend-mini">
              <Thumb src={v.poster} title={v.title} category={v.category} className="v-img" />
              <div className="trend-info">
                <span className="trend-rank">#{i + 2}</span>
                <strong>{v.title}</strong>
                <span className="trend-sub">{fmt(v.views)} views</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <SectionHeader icon="grid" title="Browse categories" />
      <div className="cat-grid">
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" className="cat-card"
            style={{ background: `linear-gradient(135deg, ${c.c1}, ${c.c2})` }}
            onClick={() => navigate(`/search?q=${encodeURIComponent(c.label)}&type=video`)}>
            <span className="cat-glow" style={{ backgroundImage: `url(${catThumb(c.id) || ''})` }} />
            <span className="cat-label">{c.label}</span>
          </button>
        ))}
      </div>

      <SectionHeader icon="bolt" title="Trending shorts" action={<Link className="rail-more" to="/shorts">View all</Link>} />
      <ShortsRail shorts={topShorts} />

      <div className="explore-cols">
        <section>
          <SectionHeader icon="users" title="Popular creators" />
          <div className="creator-scroll">
            {creators.slice(0, 8).map((u) => <CreatorCard key={u.id} user={u} />)}
          </div>
        </section>

        <section>
          <SectionHeader icon="flame" title="Trending hashtags" />
          <div className="tagcloud">
            {hashtags.map(([t, n]) => (
              <Link key={t} to={`/search?q=%23${encodeURIComponent(t)}`} className="tagchip">
                #{t} <span>{n} posts</span>
              </Link>
            ))}
          </div>
          <SectionHeader icon="search" title="Trending searches" />
          <div className="tagcloud">
            {TRENDING_SEARCHES.slice(0, 6).map((q) => (
              <Link key={q} to={`/search?q=${encodeURIComponent(q)}`} className="tagchip">
                <Icon name="search" size={13} /> {q}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <SectionHeader icon="compass" title="More to explore" />
      <div className="grid-videos">
        {rest.map((v) => <VideoCard key={v.id} video={v} />)}
      </div>
    </div>
  )
}
