// Reusable UI primitives used across every page.
import { useEffect, useRef } from 'react'
import Icon from '../lib/icons'
import { clsx } from '../lib/format'
import { useStore } from '../store/useStore'

// ── Avatar ─────────────────────────────────────────────────────
export function Avatar({ user, size = 36, className, onClick, ring = false }) {
  if (!user) return <div className="avatar skeleton" style={{ width: size, height: size }} />
  return (
    <img
      src={user.avatar} alt={user.displayName} width={size} height={size}
      className={clsx('avatar', ring && 'avatar-ring', className)}
      style={{ width: size, height: size }} onClick={onClick} loading="lazy"
    />
  )
}

// ── Verified badge ─────────────────────────────────────────────
export function Verified({ size = 14 }) {
  return <Icon name="badge" size={size} className="verified" aria-label="Verified creator" />
}

// ── Buttons ────────────────────────────────────────────────────
export function Button({ children, variant = 'soft', size, className, style, ...rest }) {
  return (
    <button type="button" className={clsx('btn', `btn-${variant}`, size && `btn-${size}`, className)} style={style} {...rest}>
      {children}
    </button>
  )
}

export function IconButton({ name, label, size = 22, className, active, solid, ...rest }) {
  return (
    <button
      type="button" className={clsx('iconbtn', active && 'active', className)}
      aria-label={label} title={label} {...rest}
    >
      <Icon name={name} size={size} solid={solid} />
    </button>
  )
}

// ── Loading ────────────────────────────────────────────────────
export function Spinner({ size = 22, className }) {
  return <span className={clsx('spinner', className)} style={{ width: size, height: size }} aria-label="Loading" />
}

export function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="Loading page">
      <div className="brand-mark cm-mark"><Icon name="play" size={20} solid /></div>
      <span className="shimmer-text">Loading…</span>
    </div>
  )
}

export function SkeletonCard({ tall = false }) {
  return (
    <div className="vcard" aria-hidden="true">
      <div className={clsx('skeleton', tall ? 'sk-tall' : 'sk-thumb')} />
      <div className="sk-row">
        <div className="skeleton sk-avatar" />
        <div className="sk-lines">
          <div className="skeleton sk-line" style={{ width: '86%' }} />
          <div className="skeleton sk-line" style={{ width: '55%' }} />
        </div>
      </div>
    </div>
  )
}

export function SkeletonFeed({ count = 6, tall = false }) {
  return (
    <div className={tall ? 'rail-shorts' : 'grid-videos'}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} tall={tall} />)}
    </div>
  )
}

// ── Empty / error states ───────────────────────────────────────
export function EmptyState({ icon = 'search', title, body, children }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} size={34} /></div>
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {children && <div className="empty-actions">{children}</div>}
    </div>
  )
}

export function ErrorBox({ title = 'Something went wrong', body, onRetry }) {
  return (
    <div className="empty err" role="alert">
      <div className="empty-icon"><Icon name="refresh" size={34} /></div>
      <h3>{title}</h3>
      <p>{body || 'We hit a network hiccup. Check your connection and try again.'}</p>
      {onRetry && <div className="empty-actions"><Button variant="primary" onClick={onRetry}>Try again</Button></div>}
    </div>
  )
}

// ── Overlay framework: modal + sheet share animation styles ────
export function Overlay({ onClose, children, className, sheet = false, label }) {
  const ref = useRef(null)
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])
  return (
    <div
      className={clsx('overlay-back', sheet && 'sheet-back')}
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div ref={ref} className={className} role="dialog" aria-modal="true" aria-label={label}>
        {sheet && <div className="sheet-grab" />}
        {children}
      </div>
    </div>
  )
}

export function Modal({ onClose, title, children, wide }) {
  return (
    <Overlay onClose={onClose} className={clsx('modal', wide && 'modal-wide')} label={title}>
      <div className="modal-head">
        <h3>{title}</h3>
        <IconButton name="x" label="Close" onClick={onClose} />
      </div>
      <div className="modal-body">{children}</div>
    </Overlay>
  )
}

export function BottomSheet({ onClose, title, children }) {
  return (
    <Overlay onClose={onClose} className="sheet" sheet label={title || 'Menu'}>
      {title && <div className="sheet-head">{title}</div>}
      {children}
    </Overlay>
  )
}

// ── Dropdown menu ──────────────────────────────────────────────
export function Menu({ items, onClose, align = 'right' }) {
  useEffect(() => {
    const close = (e) => { if (!e.target.closest?.('.menu-pop, .menu-trigger')) onClose() }
    const esc = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [onClose])
  return (
    <div className={clsx('menu-pop', `menu-${align}`)} role="menu">
      {items.filter(Boolean).map((it, i) =>
        it.divider ? (
          <div key={i} className="menu-divider" />
        ) : (
          <button
            key={i} type="button" role="menuitem"
            className={clsx('menu-item', it.danger && 'danger')}
            onClick={() => { onClose(); it.onClick?.() }}
          >
            <Icon name={it.icon} size={19} />
            <span>{it.label}</span>
            {it.right && <span className="menu-right">{it.right}</span>}
          </button>
        )
      )}
    </div>
  )
}

// ── Toggle switch ──────────────────────────────────────────────
export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label}
      className={clsx('switch', checked && 'on')}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-knob" />
    </button>
  )
}

// ── Segmented control ──────────────────────────────────────────
export function Segmented({ options, value, onChange, ariaLabel }) {
  return (
    <div className="seg" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value} type="button"
          className={clsx('seg-item', value === o.value && 'active')}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
        >
          {o.icon && <Icon name={o.icon} size={16} />}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  )
}

// ── Toasts ─────────────────────────────────────────────────────
export function ToastHost() {
  const toasts = useStore((s) => s.toasts)
  if (!toasts.length) return null
  return (
    <div className="toast-host" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {t.icon && <Icon name={t.icon} size={17} />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────
export function SectionHeader({ icon, title, action }) {
  return (
    <div className="section-header">
      <h2>{icon && <Icon name={icon} size={20} />}{title}</h2>
      {action}
    </div>
  )
}
