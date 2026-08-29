// Custom long-form video player controls:
// play/pause · seek · volume/mute · speed · quality selector (UI) · PiP · fullscreen.
import { useEffect, useRef, useState } from 'react'
import Icon from '../lib/icons'
import { clsx, fmtDuration } from '../lib/format'
import { Menu } from './ui'

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
const QUALITIES = ['Auto (1080p)', '1080p', '720p', '480p', '360p']

export default function Player({ src, poster, title, autoPlay = false, onEnded }) {
  const wrapRef = useRef(null)
  const videoRef = useRef(null)
  const hideTimer = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [dur, setDur] = useState(0)
  const [vol, setVol] = useState(1)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [quality, setQuality] = useState(QUALITIES[0])
  const [menu, setMenu] = useState(null) // 'speed' | 'quality' | null
  const [controls, setControls] = useState(true)
  const [buffered, setBuffered] = useState(0)
  const [pipOK] = useState(() => typeof document !== 'undefined' && document.pictureInPictureEnabled)
  const [err, setErr] = useState(false)
  const [loading, setLoading] = useState(true)

  const v = () => videoRef.current
  // video.play() returns undefined in some browsers/webviews — never chain on it
  const safePlay = (el) => {
    try {
      const p = el?.play?.()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } catch { /* noop */ }
  }

  useEffect(() => {
    const el = v()
    if (!el) return
    setTime(0); setPlaying(false); setErr(false); setLoading(true)
    if (autoPlay) safePlay(el)
  }, [src, autoPlay])

  const toggle = () => {
    const el = v()
    if (!el) return
    if (el.paused) safePlay(el)
    else el.pause()
  }

  const seek = (val) => {
    const el = v()
    if (!el || !dur) return
    el.currentTime = (val / 100) * dur
    setTime(el.currentTime)
  }

  const changeVol = (val) => {
    const el = v()
    if (!el) return
    el.volume = val / 100
    el.muted = val === 0
    setVol(val / 100)
    setMuted(val === 0)
  }

  const toggleMute = () => {
    const el = v()
    if (!el) return
    el.muted = !el.muted
    setMuted(el.muted)
  }

  const fullscreen = () => {
    const el = wrapRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen?.().catch(() => {})
  }

  const pip = async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture()
      else await v()?.requestPictureInPicture()
    } catch { /* unsupported */ }
  }

  const poke = () => {
    setControls(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (v() && !v().paused) setControls(false)
    }, 2600)
  }

  const onKey = (e) => {
    if (e.target.tagName === 'INPUT') return
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle() }
    if (e.key === 'f') fullscreen()
    if (e.key === 'm') toggleMute()
    if (e.key === 'ArrowRight' && v()) v().currentTime = Math.min(dur, v().currentTime + 5)
    if (e.key === 'ArrowLeft' && v()) v().currentTime = Math.max(0, v().currentTime - 5)
  }

  return (
    <div
      ref={wrapRef}
      className={clsx('player', !controls && 'player-idle')}
      onMouseMove={poke}
      onTouchStart={poke}
      onKeyDown={onKey}
      tabIndex={0}
      role="region"
      aria-label={`Video player: ${title || ''}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={onEnded}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
        onProgress={(e) => {
          const el = e.currentTarget
          try { if (el.buffered.length && dur) setBuffered((el.buffered.end(el.buffered.length - 1) / dur) * 100) } catch { /* noop */ }
        }}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        onCanPlay={() => setLoading(false)}
        onError={() => { setErr(true); setLoading(false) }}
      />

      {loading && !err && (
        <div className="player-loading"><span className="spinner big" /></div>
      )}
      {err && (
        <div className="player-error">
          <Icon name="refresh" size={30} />
          <p>This video couldn’t be loaded (offline demo asset).</p>
          <button type="button" className="btn btn-soft btn-sm" onClick={() => { setErr(false); v()?.load() }}>Retry</button>
        </div>
      )}

      {!playing && !err && !loading && (
        <button type="button" className="player-bigplay" onClick={toggle} aria-label="Play">
          <Icon name="play" size={34} solid />
        </button>
      )}

      <div className="player-grad" aria-hidden="true" />
      <div className="player-controls" onClick={(e) => e.stopPropagation()}>
        <div className="seekwrap">
          <div className="seek-buffered" style={{ width: `${buffered}%` }} />
          <input
            type="range" className="seek" min={0} max={100} step={0.1}
            value={dur ? (time / dur) * 100 : 0}
            onChange={(e) => seek(parseFloat(e.target.value))}
            aria-label="Seek"
            style={{ '--p': `${dur ? (time / dur) * 100 : 0}%` }}
          />
        </div>
        <div className="prow">
          <button type="button" className="pbtn" onClick={toggle} aria-label={playing ? 'Pause (k)' : 'Play (k)'}>
            <Icon name={playing ? 'pause' : 'play'} size={22} solid={!playing} />
          </button>
          <button type="button" className="pbtn" onClick={toggleMute} aria-label={muted ? 'Unmute (m)' : 'Mute (m)'}>
            <Icon name={muted || vol === 0 ? 'mute' : 'volume'} size={21} />
          </button>
          <input
            type="range" className="vol" min={0} max={100} value={muted ? 0 : vol * 100}
            onChange={(e) => changeVol(parseFloat(e.target.value))} aria-label="Volume"
            style={{ '--p': `${muted ? 0 : vol * 100}%` }}
          />
          <span className="ptime">{fmtDuration(time)} / {fmtDuration(dur)}</span>
          <span className="spacer" />

          <span className="menu-wrap">
            <button type="button" className="pbtn pbtn-text menu-trigger" onClick={() => setMenu(menu === 'speed' ? null : 'speed')} aria-label="Playback speed">
              <Icon name="gauge" size={20} /> {speed}×
            </button>
            {menu === 'speed' && (
              <Menu onClose={() => setMenu(null)} items={SPEEDS.map((s) => ({
                icon: s === speed ? 'check' : 'gauge',
                label: `${s}×${s === 1 ? ' (Normal)' : ''}`,
                onClick: () => { setSpeed(s); if (v()) v().playbackRate = s },
              }))} />
            )}
          </span>

          <span className="menu-wrap">
            <button type="button" className="pbtn pbtn-text menu-trigger" onClick={() => setMenu(menu === 'quality' ? null : 'quality')} aria-label="Quality">
              <Icon name="badge" size={20} /> HD
            </button>
            {menu === 'quality' && (
              <Menu onClose={() => setMenu(null)} items={QUALITIES.map((q) => ({
                icon: q === quality ? 'check' : 'monitor',
                label: q,
                onClick: () => setQuality(q), // demo: single source; UI-ready for multiple renditions
              }))} />
            )}
          </span>

          {pipOK && (
            <button type="button" className="pbtn" onClick={pip} aria-label="Picture in picture">
              <Icon name="pip" size={20} />
            </button>
          )}
          <button type="button" className="pbtn" onClick={fullscreen} aria-label="Fullscreen (f)">
            <Icon name="expand" size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
