// Direct messages — conversation list, user search, chat window, unread state.
// Structured so a realtime transport (WebSocket/Supabase) can drop in later.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../lib/icons'
import { clsx, clockTime, timeAgo } from '../lib/format'
import { useStore, useUser } from '../store/useStore'
import { useDebounced, useMedia } from '../hooks'
import { Avatar, EmptyState, Verified } from '../components/ui'

const AUTO_REPLIES = [
  'Love that! 🔥', 'haha yes 😂', 'For real. Anyway — new video drops Friday 👀',
  'Let’s collab sometime!', 'Omg thank you 💜', 'Sending you the file rn',
  'Good question — I’ll cover it in the next upload',
]

function ChatPane({ convId }) {
  const me = useUser()
  const conv = useStore((s) => s.db.conversations.find((c) => c.id === convId))
  const sendMessage = useStore((s) => s.sendMessage)
  const markRead = useStore((s) => s.markConversationRead)
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)
  const isMobile = useMedia('(max-width: 860px)')
  const navigate = useNavigate()

  const other = useStore((s) =>
    conv ? s.db.users.find((u) => u.id === conv.participantIds.find((id) => id !== s.userId)) : null
  )

  useEffect(() => { markRead(convId) }, [convId, conv?.messages.length]) // eslint-disable-line
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [conv?.messages.length, typing])

  if (!conv || !other) {
    return <EmptyState icon="mail" title="Conversation not found" body="It may have been deleted." />
  }

  const send = (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    sendMessage(convId, t)
    setText('')
    // Simulated reply — replace with realtime events later
    setTyping(true)
    setTimeout(() => {
      useStore.getState().sendMessage(convId, AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)])
      // force reply to come from the other participant
      const cv = useStore.getState().db.conversations.find((c) => c.id === convId)
      if (cv) {
        const last = cv.messages[cv.messages.length - 1]
        if (last && last.senderId === me?.id) {
          last.senderId = other.id
          last.read = isMobile || true // chat open → instantly read
        }
        useStore.getState().commit(useStore.getState().db)
      }
      setTyping(false)
    }, 1200 + Math.random() * 1400)
  }

  return (
    <div className="chat">
      <header className="chat-head">
        {isMobile && (
          <button type="button" className="iconbtn" onClick={() => navigate('/messages')} aria-label="Back to conversations">
            <Icon name="chevL" size={20} />
          </button>
        )}
        <Link to={`/profile/${other.username}`} className="chat-user">
          <Avatar user={other} size={38} />
          <div>
            <div className="creator-name">{other.displayName}{other.verified && <Verified size={13} />}</div>
            <div className="v-sub">@{other.username}</div>
          </div>
        </Link>
      </header>

      <div className="chat-body">
        {conv.messages.length === 0 && (
          <div className="chat-empty-hint">
            <Avatar user={other} size={56} ring />
            <p>Say hi to {other.displayName.split(' ')[0]} 👋</p>
          </div>
        )}
        {conv.messages.map((m, i) => {
          const mine = m.senderId === me?.id
          const prev = conv.messages[i - 1]
          const gap = !prev || m.createdAt - prev.createdAt > 30 * 60e3
          return (
            <div key={m.id}>
              {gap && <div className="chat-time">{timeAgo(m.createdAt)}</div>}
              <div className={clsx('bubble-row', mine && 'mine')}>
                {!mine && <Avatar user={other} size={26} className="bubble-avatar" />}
                <div className={clsx('bubble', mine && 'me')}>
                  <p>{m.text}</p>
                  <span className="bubble-meta">
                    {clockTime(m.createdAt)}
                    {mine && <Icon name="check" size={12} className={clsx('readtick', m.read && 'read')} />}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        {typing && (
          <div className="bubble-row">
            <Avatar user={other} size={26} className="bubble-avatar" />
            <div className="bubble typing"><span /><span /><span /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="chat-composer" onSubmit={send}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message ${other.displayName.split(' ')[0]}…`}
          aria-label="Message text" maxLength={400} />
        <button type="submit" className="btn btn-primary send-btn" disabled={!text.trim()} aria-label="Send message">
          <Icon name="send" size={18} />
        </button>
      </form>
    </div>
  )
}

export default function Messages() {
  const { convId } = useParams()
  const me = useUser()
  const navigate = useNavigate()
  const db = useStore((s) => s.db)
  const startConversation = useStore((s) => s.startConversation)
  const [query, setQuery] = useState('')
  const dq = useDebounced(query, 250)
  const isMobile = useMedia('(max-width: 860px)')

  const openConvId = convId && db.conversations.some((c) => c.id === convId) ? convId : null

  const convs = useMemo(() =>
    [...db.conversations]
      .filter((c) => c.participantIds.includes(me?.id))
      .sort((a, b) => (b.messages.at(-1)?.createdAt || 0) - (a.messages.at(-1)?.createdAt || 0)),
    [db.conversations, me]
  )

  const norm = (dq || '').toLowerCase()
  const searchResults = norm.length >= 2
    ? db.users.filter((u) => u.id !== me?.id && (u.username.toLowerCase().includes(norm) || u.displayName.toLowerCase().includes(norm))).slice(0, 6)
    : []

  const listPane = (
    <div className="convs">
      <div className="convs-head">
        <h2>Messages</h2>
        <div className="convs-search">
          <Icon name="search" size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people…" aria-label="Search users to message" />
        </div>
      </div>

      {norm.length >= 2 ? (
        <div className="convs-list">
          <div className="side-label">Start a conversation</div>
          {searchResults.length === 0 && <p className="lib-empty">No users match “{query}”.</p>}
          {searchResults.map((u) => (
            <button key={u.id} type="button" className="conv-item"
              onClick={() => { const id = startConversation(u.id); setQuery(''); navigate(`/messages/${id}`) }}>
              <Avatar user={u} size={42} />
              <span className="conv-main">
                <span className="creator-name">{u.displayName}{u.verified && <Verified size={13} />}</span>
                <span className="conv-last">@{u.username}</span>
              </span>
              <Icon name="chevR" size={16} />
            </button>
          ))}
        </div>
      ) : (
        <div className="convs-list">
          {convs.length === 0 && (
            <EmptyState icon="mail" title="No messages yet"
              body="Search for a creator above and say hello." />
          )}
          {convs.map((cv) => {
            const other = db.users.find((u) => u.id === cv.participantIds.find((id) => id !== me?.id))
            const last = cv.messages.at(-1)
            const unread = cv.messages.some((m) => m.senderId !== me?.id && !m.read)
            return (
              <button key={cv.id} type="button"
                className={clsx('conv-item', openConvId === cv.id && 'active')}
                onClick={() => navigate(`/messages/${cv.id}`)}>
                <Avatar user={other} size={42} />
                <span className="conv-main">
                  <span className={clsx('creator-name', unread && 'unread-name')}>{other?.displayName}</span>
                  <span className={clsx('conv-last', unread && 'unread')}>
                    {last ? `${last.senderId === me?.id ? 'You: ' : ''}${last.text}` : 'Say hello 👋'}
                  </span>
                </span>
                <span className="conv-side">
                  <small>{last ? timeAgo(last.createdAt) : ''}</small>
                  {unread && <span className="unread-dot" aria-label="Unread messages" />}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  const chatPane = openConvId ? (
    <ChatPane convId={openConvId} />
  ) : (
    <div className="chat-placeholder">
      <EmptyState icon="mail" title="Your messages"
        body="Pick a conversation, or search for someone to message." />
    </div>
  )

  if (isMobile) return <div className="page msgs-page">{openConvId ? chatPane : listPane}</div>
  return (
    <div className="page msgs-page desktop">
      {listPane}
      {chatPane}
    </div>
  )
}
