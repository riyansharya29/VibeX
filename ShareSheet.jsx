// Global share sheet — Copy link + native share (when available) + mock socials.
import { useState } from 'react'
import Icon from '../lib/icons'
import { useStore } from '../store/useStore'
import { BottomSheet } from './ui'
import { clsx } from '../lib/format'

export default function ShareSheet() {
  const share = useStore((s) => s.ui.share)
  const closeShare = useStore((s) => s.closeShare)
  const toast = useStore((s) => s.toast)
  const [copied, setCopied] = useState(false)
  if (!share) return null
  const { type, id, title } = share
  const link = share.profile
    ? `${location.origin}/profile/${id}`
    : `${location.origin}/${type === 'video' ? 'watch' : type + 's'}/${id}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast('Link copied to clipboard', 'check')
      setTimeout(closeShare, 450)
    } catch {
      toast('Copy failed — long-press the link instead', 'x')
    }
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title: title || 'VibeX', text: title, url: link })
      closeShare()
    } catch { /* user cancelled */ }
  }

  const social = (name) => () => {
    toast(`Opening ${name}… (demo)`, 'share')
    setTimeout(closeShare, 500)
  }

  return (
    <BottomSheet onClose={closeShare} title="Share">
      <div className="share-target">
        <Icon name="link" size={18} />
        <span className="share-link">{link}</span>
      </div>
      <div className="share-grid">
        {typeof navigator.share === 'function' && (
          <button type="button" className="share-option" onClick={nativeShare}>
            <span className="share-bubble brand-grad"><Icon name="share" size={20} /></span>
            <span>System share</span>
          </button>
        )}
        <button type="button" className="share-option" onClick={copy}>
          <span className={clsx('share-bubble', copied && 'brand-grad')}><Icon name={copied ? 'check' : 'copy'} size={20} /></span>
          <span>{copied ? 'Copied!' : 'Copy link'}</span>
        </button>
        <button type="button" className="share-option" onClick={social('chat apps')}>
          <span className="share-bubble" style={{ background: '#25D36622', color: '#25D366' }}><Icon name="send" size={20} /></span>
          <span>Message</span>
        </button>
        <button type="button" className="share-option" onClick={social('mail')}>
          <span className="share-bubble" style={{ background: '#4f8cff22', color: '#4f8cff' }}><Icon name="mail" size={20} /></span>
          <span>Email</span>
        </button>
        <button type="button" className="share-option" onClick={social('story')}>
          <span className="share-bubble" style={{ background: '#ec489922', color: '#ec4899' }}><Icon name="image" size={20} /></span>
          <span>Story</span>
        </button>
      </div>
    </BottomSheet>
  )
}
