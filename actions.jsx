// Content action buttons: like, dislike, save, share, follow, more-menu.
// All animated, all wired to the global store.
import { useState } from 'react'
import Icon from '../lib/icons'
import { clsx, fmt } from '../lib/format'
import { useStore } from '../store/useStore'
import { IconButton, Menu } from './ui'

export function LikeButton({ type, id, count = true, size = 22, row = false }) {
  const liked = useStore((s) => !!s.liked[`${type}:${id}`])
  const toggleLike = useStore((s) => s.toggleLike)
  const item = useStore((s) => {
    const arr = type === 'video' ? s.db.videos : type === 'short' ? s.db.shorts : s.db.posts
    return arr.find((x) => x.id === id)
  })
  const [pop, setPop] = useState(false)
  if (!item) return null
  const click = (e) => {
    e.stopPropagation(); e.preventDefault()
    toggleLike(type, id)
    setPop(true)
    setTimeout(() => setPop(false), 380)
  }
  return (
    <button
      type="button"
      className={clsx('act', liked && 'on-like', pop && 'pop', row && 'act-row')}
      aria-pressed={liked}
      aria-label={`Like (${fmt(item.likes)})`}
      onClick={click}
    >
      <span className="act-icon">
        <Icon name={liked ? 'heart' : 'heart'} size={size} solid={liked} />
        {pop && liked && <span className="act-burst" />}
      </span>
      {count && <span className="act-count">{fmt(item.likes)}</span>}
    </button>
  )
}

export function DislikeButton({ type, id, size = 22 }) {
  const disliked = useStore((s) => !!s.disliked[`${type}:${id}`])
  const toggleDislike = useStore((s) => s.toggleDislike)
  return (
    <button
      type="button"
      className={clsx('act', disliked && 'on-like')}
      aria-pressed={disliked}
      aria-label="Dislike"
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleDislike(type, id) }}
    >
      <span className="act-icon"><Icon name="dislike" size={size} solid={disliked} /></span>
    </button>
  )
}

export function SaveButton({ type, id, size = 22, label = true }) {
  const saved = useStore((s) => !!s.saved[`${type}:${id}`])
  const toggleSave = useStore((s) => s.toggleSave)
  return (
    <button
      type="button"
      className={clsx('act', saved && 'on-save')}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved' : 'Save'}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleSave(type, id) }}
    >
      <span className="act-icon"><Icon name="bookmark" size={size} solid={saved} /></span>
      {label && <span className="act-count">{saved ? 'Saved' : 'Save'}</span>}
    </button>
  )
}

export function ShareButton({ type, id, title, size = 22, label = 'Share' }) {
  const openShare = useStore((s) => s.openShare)
  return (
    <button
      type="button" className="act" aria-label={label}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); openShare({ type, id, title }) }}
    >
      <span className="act-icon"><Icon name="share" size={size} /></span>
      {label && <span className="act-count">{label}</span>}
    </button>
  )
}

export function FollowButton({ creator, size = 'md', block = false }) {
  const following = useStore((s) => !!s.following[creator?.id])
  const toggleFollow = useStore((s) => s.toggleFollow)
  const user = useStore((s) => s.db.users.find((u) => u.id === s.userId))
  if (!creator || creator.id === user?.id) return null
  return (
    <button
      type="button"
      className={clsx('btn', following ? 'btn-soft' : 'btn-primary', size === 'sm' && 'btn-sm', block && 'btn-block', 'follow-btn')}
      aria-pressed={following}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleFollow(creator.id) }}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  )
}

/** Overflow "⋯" menu shared by cards and pages. */
export function MoreMenu({ type, id, title, creator }) {
  const [open, setOpen] = useState(false)
  const openShare = useStore((s) => s.openShare)
  const toggleSave = useStore((s) => s.toggleSave)
  const saved = useStore((s) => !!s.saved[`${type}:${id}`])
  const markNotInterested = useStore((s) => s.markNotInterested)
  const report = useStore((s) => s.report)
  const toast = useStore((s) => s.toast)

  const link = `${location.origin}/${type === 'video' ? 'watch' : type}s/${id}`
  return (
    <span className="menu-wrap">
      <IconButton
        name="dots" label="More options" className="menu-trigger"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen((o) => !o) }}
      />
      {open && (
        <Menu
          onClose={() => setOpen(false)}
          items={[
            { icon: 'bookmark', label: saved ? 'Remove from saved' : 'Save', onClick: () => toggleSave(type, id) },
            { icon: 'share', label: 'Share…', onClick: () => openShare({ type, id, title }) },
            { icon: 'link', label: 'Copy link', onClick: () => { navigator.clipboard?.writeText(link).catch(() => {}); toast('Link copied', 'check') } },
            { divider: true },
            { icon: 'eyeoff', label: 'Not interested', onClick: () => markNotInterested(type, id) },
            { icon: 'flag', label: 'Report', danger: true, onClick: () => report(type, id, 'User report') },
          ]}
        />
      )}
    </span>
  )
}
