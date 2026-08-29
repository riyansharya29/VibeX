// ─────────────────────────────────────────────────────────────
// BRAND CONFIG — change these values to rebrand the entire app.
// Name, logo colors and gradients are applied globally at runtime.
// ─────────────────────────────────────────────────────────────
export const BRAND = {
  name: 'VibeX',
  tagline: 'Share your vibe.',
  // Primary brand palette (applied to CSS variables in main.jsx)
  colors: {
    accentA: '#8b5cf6', // violet
    accentB: '#4f8cff', // blue
    accentC: '#06d6a0', // mint
  },
  // Used for SEO/meta text
  description: 'VibeX — a social video platform for long videos, shorts and posts.',
}

export const CATEGORIES = [
  { id: 'education',     label: 'Education',     c1: '#4f8cff', c2: '#8b5cf6' },
  { id: 'gaming',        label: 'Gaming',        c1: '#7c3aed', c2: '#ec4899' },
  { id: 'technology',    label: 'Technology',    c1: '#0ea5e9', c2: '#6366f1' },
  { id: 'music',         label: 'Music',         c1: '#f59e0b', c2: '#ef4444' },
  { id: 'sports',        label: 'Sports',        c1: '#10b981', c2: '#3b82f6' },
  { id: 'comedy',        label: 'Comedy',        c1: '#f97316', c2: '#eab308' },
  { id: 'vlogs',         label: 'Vlogs',         c1: '#ec4899', c2: '#8b5cf6' },
  { id: 'science',       label: 'Science',       c1: '#06b6d4', c2: '#10b981' },
  { id: 'entertainment', label: 'Entertainment', c1: '#a855f7', c2: '#f43f5e' },
  { id: 'news',          label: 'News',          c1: '#64748b', c2: '#0ea5e9' },
]

export const catById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0]
