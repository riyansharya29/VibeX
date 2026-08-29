// Comments with like / reply (1 level) / delete-own — used on Watch, Shorts and Posts.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../lib/icons'
import { clsx, fmt, timeAgo } from '../lib/format'
import { useStore, useUser } from '../store/useStore'
import { Avatar, EmptyState, Verified } from './ui'

function Comment({ c, onReply, depth = 0 }) {
  const me = useUser()
  const user = useStore((s) => s.db.users.find((u) => u.id === c.userId))
  const liked = useStore((s) => !!s.liked[`comment:${c.id}`])
  const toggleLike = useStore((s) => s.toggleCommentLike)
  const deleteComment = useStore((s) => s.deleteComment)
  const isOwn = me?.id === c.userId
  return (
    <div className={clsx('c-item', depth > 0 && 'c-reply')}>
      <Link to={`/profile/${user?.username}`} aria-label={user?.displayName}>
        <Avatar user={user} size={depth > 0 ? 26 : 34} />
      </Link>
      <div className="c-main">
        <div className="c-head">
          <Link to={`/profile/${user?.username}`} className="c-user">
            {user?.displayName || 'Former user'}
            {user?.verified && <Verified size={13} />}
          </Link>
          <span className="c-time">{timeAgo(c.createdAt)}</span>
        </div>
        <p className="c-text">{c.text}</p>
        <div className="c-actions">
          <button type="button" className={clsx('c-act', liked && 'on-like')} onClick={() => toggleLike(c.id)} aria-pressed={liked}>
            <Icon name="like" size={15} solid={liked} />
            <span>{fmt(c.likes)}</span>
          </button>
          {depth === 0 && (
            <button type="button" className="c-act" onClick={() => onReply(c)}>
              <Icon name="reply" size={15} /><span>Reply</span>
            </button>
          )}
          {isOwn && (
            <button type="button" className="c-act danger" onClick={() => deleteComment(c.id)}>
              <Icon name="trash" size={15} /><span>Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Comments({ contentType, contentId, commentCount = 0 }) {
  const me = useUser()
  const comments = useStore((s) => s.db.comments)
  const addComment = useStore((s) => s.addComment)
  const toast = useStore((s) => s.toast)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState(null)

  const { roots, repliesOf } = useMemo(() => {
    const list = comments.filter((c) => c.contentType === contentType && c.contentId === contentId)
    const roots = list.filter((c) => !c.parentId).sort((a, b) => b.createdAt - a.createdAt)
    const repliesOf = {}
    list.filter((c) => c.parentId).forEach((c) => {
      (repliesOf[c.parentId] ||= []).push(c)
    })
    Object.values(repliesOf).forEach((r) => r.sort((a, b) => a.createdAt - b.createdAt))
    return { roots, repliesOf }
  }, [comments, contentType, contentId])

  const submit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    if (!me) {
      toast('Sign in to comment', 'user')
      return
    }
    addComment(contentType, contentId, text, replyTo?.id || null)
    setText('')
    setReplyTo(null)
  }

  return (
    <section className="comments" aria-label="Comments">
      <h3 className="comments-title">
        Comments <span className="dot-sep">·</span> <span className="muted">{fmt(commentCount + roots.length * 0)}</span>
      </h3>

      <form className="c-form" onSubmit={submit}>
        <Avatar user={me} size={34} />
        <div className="c-inputwrap">
          {replyTo && (
            <div className="c-replying">
              Replying to a comment
              <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply"><Icon name="x" size={13} /></button>
            </div>
          )}
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={me ? (replyTo ? 'Write a reply…' : 'Add a comment…') : 'Sign in to comment'}
            aria-label="Write a comment"
            maxLength={500}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!text.trim()}>Post</button>
      </form>

      {roots.length === 0 ? (
        <EmptyState icon="comment" title="No comments yet" body="Be the first to share your thoughts." />
      ) : (
        <div className="c-list">
          {roots.map((c) => (
            <div key={c.id}>
              <Comment c={c} onReply={setReplyTo} />
              {(repliesOf[c.id] || []).map((r) => (
                <Comment key={r.id} c={r} onReply={setReplyTo} depth={1} />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
