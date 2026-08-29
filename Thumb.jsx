// <Thumb> renders remote/AI thumbnails with an automatic SVG-gradient fallback
// so a missing asset never breaks the layout.
import { useState } from 'react'
import { svgThumb } from '../lib/media'
import { catById } from '../config/brand'

export default function Thumb({ src, title = '', category = 'technology', className, alt = '', vertical = false }) {
  const cat = catById(category === 'cooking' ? 'entertainment' : category)
  const fallback = vertical
    ? svgThumb(title, cat.c1, cat.c2, 360, 640)
    : svgThumb(title, cat.c1, cat.c2)
  const [err, setErr] = useState(false)
  return (
    <img
      src={err || !src ? fallback : src}
      alt={alt || title}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setErr(true)}
      draggable="false"
    />
  )
}
