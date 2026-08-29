import { useEffect, useRef, useState } from 'react'

/** Debounce a changing value (used for search input). */
export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/** IntersectionObserver-based visibility hook (lazy media, infinite scroll). */
export function useOnScreen(options = {}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return }
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: options.rootMargin || '120px', threshold: options.threshold ?? 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

/** Media-query hook */
export function useMedia(query) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const fn = (e) => setMatch(e.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [query])
  return match
}

/** Persisted localStorage state */
export function useLocalState(key, initial) {
  const [v, setV] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw != null ? JSON.parse(raw) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch { /* ignore */ }
  }, [key, v])
  return [v, setV]
}
