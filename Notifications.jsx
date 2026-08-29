// Notifications — grouped Today / Yesterday / Earlier with unread indicators.
import Icon from '../lib/icons'
import { useNavigate } from 'react-router-dom'
import { clsx, timeAgo } from '../lib/format'
import { useStore } from '../store/useStore'
import { Avatar, EmptyState, Button } from '../components/ui'

const TYPE_META = {
  follower: { icon: 'user', text: (a) => `started following you` },
  like: { icon: 'heart', text: () => `liked your content` },
  comment: { icon: 'comment', text: () => `commented: “This is so good 🔥”` },
  reply: { icon: 'reply', text: () => `replied to your comment` },
  upload: { icon: 'upload', text: () => `just uploaded something new` },
}
const DAY = 86400e3

export default function Notifications() {
  const navigate = useNavigate()
  const db = useStore((s) => s.db)
  const userId = useStore((s) => s.userId)
  const markAllRead = useStore((s) => s.markAllRead)
  const markRead = useStore((s) => s.markRead)

  const notifs = db.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt)

  const now = Date.now()
  const today = [], yesterday = [], earlier = []
  notifs.forEach((n) => {
    const age = now - n.createdAt
    if (age < DAY && new Date(n.createdAt).getDate() === new Date().getDate()) today.push(n)
    else if (age < 2 * DAY) yesterday.push(n)
    else earlier.push(n)
  })

  const open = (n) => {
    markRead(n.id)
    const actor = db.users.find((u) => u.id === n.actorId)
    if (n.type === 'upload' && n.contentType === 'video') navigate(`/watch/${n.contentId}`)
    else if (n.type === 'upload' && n.contentType === 'short') navigate(`/shorts/${n.contentId}`)
    else if (actor) navigate(`/profile/${actor.username}`)
  }

  const Group = ({ label, items }) => items.length === 0 ? null : (
    <section className="notif-group">
      <div className="side-label">{label}</div>
      {items.map((n) => {
        const actor = db.users.find((u) => u.id === n.actorId)
        const meta = TYPE_META[n.type] || TYPE_META.like
        return (
          <button key={n.id} type="button" className={clsx('notif', !n.read && 'notif-unread')} onClick={() => open(n)}>
            <span className="notif-avatar">
              <Avatar user={actor} size={44} />
              <span className={`notif-badge t-${n.type}`}><Icon name={meta.icon} size={11} solid={n.type === 'like'} /></span>
            </span>
            <span className="notif-text">
              <strong>{actor?.displayName || 'Someone'}</strong> {meta.text(actor)}
              <small>{timeAgo(n.createdAt)}</small>
            </span>
            {!n.read && <span className="unread-dot" aria-label="Unread" />}
          </button>
        )
      })}
    </section>
  )

  return (
    <div className="page notifs-page">
      <div className="notifs-head">
        <h2>Notifications</h2>
        {notifs.some((n) => !n.read) && (
          <Button variant="ghost" size="sm" onClick={markAllRead}><Icon name="check" size={15} /> Mark all read</Button>
        )}
      </div>

      {notifs.length === 0 ? (
        <EmptyState icon="bell" title="No notifications yet"
          body="When people interact with you or creators you follow upload, it shows up here." />
      ) : (
        <>
          <Group label="Today" items={today} />
          <Group label="Yesterday" items={yesterday} />
          <Group label="Earlier" items={earlier} />
        </>
      )}
    </div>
  )
}
