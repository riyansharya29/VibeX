// Global application state (zustand). DB content lives in `db` and is
// persisted to localStorage; per-user interaction state is persisted separately.
import { create } from 'zustand'
import { loadDB, saveDB } from '../lib/db'
import { getSessionUserId, setSessionUserId } from '../lib/auth'
import { uid } from '../lib/format'

const STATE_KEY = 'vibex_state_v1'

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

const defaultState = () => ({
  theme: 'system',        // 'light' | 'dark' | 'system'
  autoplay: true,
  muted: true,            // shorts/feed audio preference
  language: 'en',
  notifPrefs: { likes: true, comments: true, followers: true, uploads: true, messages: true },
  liked: {},              // `${type}:${id}` -> true
  disliked: {},
  saved: {},              // `${type}:${id}` -> true
  following: { u1: true, u3: true, u6: true },
  notInterested: [],      // `${type}:${id}`
  history: {},            // id -> timestamp
  recentSearches: [],
  blocked: ['u9'],
})

function persist(st, sessionUserId) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify({
      theme: st.theme, autoplay: st.autoplay, muted: st.muted, language: st.language,
      notifPrefs: st.notifPrefs, liked: st.liked, disliked: st.disliked, saved: st.saved,
      following: st.following, notInterested: st.notInterested, history: st.history,
      recentSearches: st.recentSearches, blocked: st.blocked,
    }))
  } catch { /* ignore */ }
  if (sessionUserId !== undefined) setSessionUserId(sessionUserId)
}

const initialDb = loadDB()
const saved = loadState() || {}
const sessionId = getSessionUserId()
const sessionUser = sessionId && initialDb.users.find((u) => u.id === sessionId)
  ? sessionId
  : 'u_demo'

export const useStore = create((set, get) => ({
  db: initialDb,
  userId: sessionUser,
  ...defaultState(),
  ...saved,
  following: { ...defaultState().following, ...(saved.following || {}) },
  toasts: [],
  ui: { createOpen: false, uploadTab: null, share: null },

  // ── helpers ──
  user: () => get().db.users.find((u) => u.id === get().userId) || null,
  commit: (db) => {
    saveDB(db)
    set({ db: { ...db } })
  },
  touch: (patch = {}, sessionUserId) => {
    set(patch)
    persist({ ...get(), ...patch }, sessionUserId)
  },

  // ── auth ──
  setUser: (id) => {
    get().touch({ userId: id }, id)
  },

  // ── settings ──
  setTheme: (theme) => get().touch({ theme }),
  setAutoplay: (autoplay) => get().touch({ autoplay }),
  setMuted: (muted) => get().touch({ muted }),
  setLanguage: (language) => get().touch({ language }),
  setNotifPref: (key, val) => get().touch({ notifPrefs: { ...get().notifPrefs, [key]: val } }),
  toggleBlocked: (uid2) => {
    const b = get().blocked
    get().touch({ blocked: b.includes(uid2) ? b.filter((x) => x !== uid2) : [...b, uid2] })
  },

  // ── toasts ──
  toast: (text, icon) => {
    const id = uid('t')
    set({ toasts: [...get().toasts, { id, text, icon }] })
    setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 2600)
  },

  // ── ui shell ──
  openCreate: () => set({ ui: { ...get().ui, createOpen: true } }),
  closeCreate: () => set({ ui: { ...get().ui, createOpen: false } }),
  openUpload: (tab) => set({ ui: { createOpen: false, uploadTab: tab, share: null } }),
  closeUpload: () => set({ ui: { ...get().ui, uploadTab: null } }),
  openShare: (payload) => set({ ui: { ...get().ui, share: payload } }),
  closeShare: () => set({ ui: { ...get().ui, share: null } }),

  // ── content lookups ──
  findContent: (type, id) => {
    const { db } = get()
    const arr = type === 'video' ? db.videos : type === 'short' ? db.shorts : db.posts
    return arr.find((x) => x.id === id) || null
  },

  // ── likes / dislikes ──
  toggleLike: (type, id) => {
    const { db, liked } = get()
    const key = `${type}:${id}`
    const item = get().findContent(type, id)
    if (!item) return
    const on = !liked[key]
    item.likes = Math.max(0, item.likes + (on ? 1 : -1))
    get().commit(db)
    get().touch({ liked: { ...liked, [key]: on } })
  },
  toggleDislike: (type, id) => {
    const { db, disliked, liked } = get()
    const key = `${type}:${id}`
    const item = get().findContent(type, id)
    if (!item) return
    const on = !disliked[key]
    if (on && liked[key]) {
      item.likes = Math.max(0, item.likes - 1)
      get().touch({ liked: { ...liked, [key]: false } })
    }
    get().commit(db)
    get().touch({ disliked: { ...disliked, [key]: on } })
  },

  // ── save / unsave ──
  toggleSave: (type, id) => {
    const { saved } = get()
    const key = `${type}:${id}`
    const on = !saved[key]
    get().touch({ saved: { ...saved, [key]: on } })
    get().toast(on ? 'Saved to your library' : 'Removed from saved', on ? 'bookmark' : 'x')
  },

  // ── follow ──
  toggleFollow: (creatorId) => {
    const { db, following, userId } = get()
    const on = !following[creatorId]
    const creator = db.users.find((u) => u.id === creatorId)
    const me = db.users.find((u) => u.id === userId)
    if (creator) creator.followers = Math.max(0, creator.followers + (on ? 1 : -1))
    if (me && me.id !== creatorId) me.following = Math.max(0, (me.following || 0) + (on ? 1 : -1))
    if (on && creator) {
      db.notifications.unshift({
        id: uid('n'), userId, type: 'follower', actorId: creatorId,
        contentType: null, contentId: null, read: false, createdAt: Date.now(),
      })
    }
    get().commit(db)
    get().touch({ following: { ...following, [creatorId]: on } })
    if (creator) get().toast(on ? `Following @${creator.username}` : `Unfollowed @${creator.username}`, on ? 'badge' : 'x')
  },

  // ── comments ──
  commentsFor: (type, id) =>
    get().db.comments.filter((c) => c.contentType === type && c.contentId === id),
  addComment: (type, contentId, text, parentId = null) => {
    const { db, userId } = get()
    const c = {
      id: uid('c'), userId, contentType: type, contentId,
      text: text.trim(), parentId, likes: 0, createdAt: Date.now(),
    }
    db.comments.push(c)
    const item = get().findContent(type, contentId)
    if (item) item.commentCount = (item.commentCount || 0) + 1
    get().commit(db)
    return c
  },
  deleteComment: (commentId) => {
    const { db } = get()
    const target = db.comments.find((c) => c.id === commentId)
    if (!target) return
    // remove comment + its replies
    const replyIds = db.comments.filter((c) => c.parentId === commentId).map((c) => c.id)
    db.comments = db.comments.filter((c) => c.id !== commentId && c.parentId !== commentId)
    const item = get().findContent(target.contentType, target.contentId)
    if (item) item.commentCount = Math.max(0, (item.commentCount || 1) - 1 - replyIds.length)
    get().commit(db)
    get().toast('Comment deleted', 'trash')
  },
  toggleCommentLike: (commentId) => {
    const { db, liked } = get()
    const key = `comment:${commentId}`
    const c = db.comments.find((x) => x.id === commentId)
    if (!c) return
    const on = !liked[key]
    c.likes = Math.max(0, c.likes + (on ? 1 : -1))
    get().commit(db)
    get().touch({ liked: { ...liked, [key]: on } })
  },

  // ── views / history ──
  recordView: (type, id) => {
    const { db, history } = get()
    const item = get().findContent(type, id)
    if (item) {
      item.views = (item.views || 0) + 1
      get().commit(db)
    }
    if (type === 'video' && history[id] !== Math.floor(Date.now() / 1e4)) {
      get().touch({ history: { ...history, [id]: Date.now() } })
    }
  },
  clearHistory: () => get().touch({ history: {} }),

  // ── search ──
  addRecentSearch: (q) => {
    const list = [q, ...get().recentSearches.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 8)
    get().touch({ recentSearches: list })
  },
  clearRecentSearches: () => get().touch({ recentSearches: [] }),

  // ── not interested / report ──
  markNotInterested: (type, id) => {
    get().touch({ notInterested: [...get().notInterested, `${type}:${id}`] })
    get().toast('Got it — you’ll see less of this', 'eyeoff')
  },
  report: (kind, targetId, reason) => {
    const { db, userId } = get()
    db.reports.unshift({
      id: uid('r'), type: kind, targetId, reason: reason || 'Reported by user',
      reporterId: userId, createdAt: Date.now(), status: 'open',
    })
    get().commit(db)
    get().toast('Thanks — our team will review this', 'flag')
  },

  // ── uploads / posts ──
  addVideo: (v) => {
    const { db } = get()
    db.videos.unshift(v)
    get().commit(db)
  },
  addShort: (s) => {
    const { db } = get()
    db.shorts.unshift(s)
    get().commit(db)
  },
  addPost: (p) => {
    const { db } = get()
    db.posts.unshift(p)
    get().commit(db)
  },

  // ── notifications ──
  markAllRead: () => {
    const { db, userId } = get()
    db.notifications.forEach((n) => { if (n.userId === userId) n.read = true })
    get().commit(db)
  },
  markRead: (id) => {
    const { db } = get()
    const n = db.notifications.find((x) => x.id === id)
    if (n) { n.read = true; get().commit(db) }
  },
  unreadNotifCount: () => get().db.notifications.filter((n) => n.userId === get().userId && !n.read).length,

  // ── messages ──
  unreadMessageCount: () => {
    const { db, userId } = get()
    return db.conversations.reduce(
      (acc, cv) => acc + (cv.messages.some((m) => m.senderId !== userId && !m.read) ? 1 : 0), 0
    )
  },
  sendMessage: (convId, text) => {
    const { db, userId } = get()
    const cv = db.conversations.find((c) => c.id === convId)
    if (!cv) return
    cv.messages.push({ id: uid('m'), senderId: userId, text: text.trim(), createdAt: Date.now(), read: true })
    get().commit(db)
  },
  markConversationRead: (convId) => {
    const { db, userId } = get()
    const cv = db.conversations.find((c) => c.id === convId)
    if (!cv) return
    let dirty = false
    cv.messages.forEach((m) => { if (m.senderId !== userId && !m.read) { m.read = true; dirty = true } })
    if (dirty) get().commit(db)
  },
  startConversation: (otherId) => {
    const { db, userId } = get()
    let cv = db.conversations.find(
      (c) => c.participantIds.includes(userId) && c.participantIds.includes(otherId)
    )
    if (!cv) {
      cv = { id: uid('cv'), participantIds: [userId, otherId], messages: [] }
      db.conversations.unshift(cv)
      get().commit(db)
    }
    return cv.id
  },

  // ── admin ──
  resolveReport: (reportId, action) => {
    const { db } = get()
    const r = db.reports.find((x) => x.id === reportId)
    if (!r) return
    if (action === 'remove') {
      if (r.type === 'video') db.videos = db.videos.filter((v) => v.id !== r.targetId)
      if (r.type === 'short') db.shorts = db.shorts.filter((s) => s.id !== r.targetId)
      if (r.type === 'comment') db.comments = db.comments.filter((c) => c.id !== r.targetId && c.parentId !== r.targetId)
      r.status = 'removed'
    } else {
      r.status = 'dismissed'
    }
    get().commit(db)
    get().toast(action === 'remove' ? 'Content removed' : 'Report dismissed', action === 'remove' ? 'trash' : 'check')
  },
}))

// Selector helpers
export const useUser = () => useStore((s) => s.db.users.find((u) => u.id === s.userId) || null)
export const useDbUser = (id) => useStore((s) => s.db.users.find((u) => u.id === id) || null)
