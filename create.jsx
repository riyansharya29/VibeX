// Create bottom-sheet + upload modal (Video / Short / Post) with validation,
// simulated progress and a mock media pipeline that a backend can later adopt.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../lib/icons'
import { CATEGORIES, catById } from '../config/brand'
import { svgThumb, SAMPLE_SRc } from '../lib/media'
import { uid, clsx } from '../lib/format'
import { useStore, useUser } from '../store/useStore'
import { BottomSheet, Modal, Spinner } from './ui'

const MAX_MB = 200

// ── Entry sheet (from + button) ────────────────────────────────
export function CreateSheet() {
  const open = useStore((s) => s.ui.createOpen)
  const closeCreate = useStore((s) => s.closeCreate)
  const openUpload = useStore((s) => s.openUpload)
  if (!open) return null
  const items = [
    { tab: 'video', icon: 'upload', title: 'Upload video', desc: 'Long-form content for your channel' },
    { tab: 'short', icon: 'bolt', title: 'Upload short', desc: 'Vertical clips up to 60 seconds' },
    { tab: 'post', icon: 'image', title: 'Create post', desc: 'Photos, carousels or a text update' },
  ]
  return (
    <BottomSheet onClose={closeCreate} title="Create">
      <div className="create-list">
        {items.map((it) => (
          <button key={it.tab} type="button" className="create-item" onClick={() => openUpload(it.tab)}>
            <span className="create-icon"><Icon name={it.icon} size={22} /></span>
            <span className="create-text">
              <strong>{it.title}</strong>
              <small>{it.desc}</small>
            </span>
            <Icon name="chevR" size={18} />
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}

// ── Shared bits ────────────────────────────────────────────────
function Field({ label, hint, error, children, required }) {
  return (
    <label className="field">
      <span className="field-label">{label}{required && <em>*</em>}</span>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  )
}

function VisibilityPicker({ value, onChange }) {
  const opts = [
    { id: 'public', icon: 'globe', label: 'Public', desc: 'Anyone can find and watch' },
    { id: 'unlisted', icon: 'link', label: 'Unlisted', desc: 'Only people with the link' },
    { id: 'private', icon: 'lock', label: 'Private', desc: 'Only you can view' },
  ]
  return (
    <div className="vis-row" role="radiogroup" aria-label="Visibility">
      {opts.map((o) => (
        <button
          key={o.id} type="button" role="radio" aria-checked={value === o.id}
          className={clsx('vis-opt', value === o.id && 'active')}
          onClick={() => onChange(o.id)}
        >
          <Icon name={o.icon} size={18} />
          <span><strong>{o.label}</strong><small>{o.desc}</small></span>
        </button>
      ))}
    </div>
  )
}

function FileDrop({ accept, icon, label, file, onPick, hint, error, preview }) {
  const ref = useRef(null)
  return (
    <div className={clsx('filedrop', error && 'filedrop-err', file && 'filedrop-has')}>
      <button type="button" className="filedrop-btn" onClick={() => ref.current?.click()}>
        {preview && file ? (
          file.type.startsWith('image') ? <img src={preview} alt="preview" className="filedrop-preview-img" /> :
          <video src={preview} className="filedrop-preview-img" muted playsInline />
        ) : (
          <>
            <span className="fd-icon"><Icon name={icon} size={26} /></span>
            <span className="fd-label">{label}</span>
            <span className="fd-hint">{hint}</span>
          </>
        )}
      </button>
      {file && (
        <div className="fd-file">
          <Icon name="check" size={14} />
          <span>{file.name} · {(file.size / 1048576).toFixed(1)} MB</span>
          <button type="button" className="fd-clear" onClick={() => onPick(null)} aria-label="Remove file"><Icon name="x" size={14} /></button>
        </div>
      )}
      <input ref={ref} type="file" accept={accept} hidden onChange={(e) => onPick(e.target.files?.[0] || null)} />
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  )
}

const validateFile = (file, kind /* 'video' | 'image' */) => {
  if (!file) return null
  if (kind === 'video' && !file.type.startsWith('video/')) return 'Unsupported file type — please choose a video file.'
  if (kind === 'image' && !file.type.startsWith('image/')) return 'Unsupported file type — please choose an image.'
  if (file.size > MAX_MB * 1048576) return `File is too large — max ${MAX_MB} MB for this demo.`
  return null
}

// ── Upload modal ───────────────────────────────────────────────
export function UploadModal() {
  const tab = useStore((s) => s.ui.uploadTab)
  const closeUpload = useStore((s) => s.closeUpload)
  const me = useUser()
  const [stage, setStage] = useState('form') // form | progress | done
  const [progress, setProgress] = useState(0)
  const [submitted, setSubmitted] = useState(null) // {type, id}

  useEffect(() => {
    if (tab) { setStage('form'); setProgress(0); setSubmitted(null) }
  }, [tab])

  if (!tab || !me) return null

  const finish = (type, item) => {
    const store = useStore.getState()
    if (type === 'video') store.addVideo(item)
    if (type === 'short') store.addShort(item)
    if (type === 'post') store.addPost(item)
    setSubmitted({ type, id: item.id })
    setStage('progress')
    // Simulated upload pipeline — swap for a real multipart upload later
    let p = 0
    const t = setInterval(() => {
      p += 6 + Math.random() * 12
      if (p >= 100) {
        clearInterval(t)
        setProgress(100)
        setStage('done')
      } else setProgress(Math.floor(p))
    }, 90)
  }

  return (
    <Modal onClose={closeUpload} wide title={
      stage === 'done' ? 'Published 🎉' : stage === 'progress' ? 'Uploading…' :
      tab === 'video' ? 'Upload video' : tab === 'short' ? 'Upload short' : 'Create post'
    }>
      {stage === 'form' && tab === 'video' && <VideoForm me={me} onSubmit={finish} />}
      {stage === 'form' && tab === 'short' && <ShortForm me={me} onSubmit={finish} />}
      {stage === 'form' && tab === 'post' && <PostForm me={me} onSubmit={finish} />}
      {stage !== 'form' && <UploadProgress stage={stage} progress={progress} submitted={submitted} closeUpload={closeUpload} />}
    </Modal>
  )
}

function UploadProgress({ stage, progress, submitted, closeUpload }) {
  const navigate = useNavigate()
  if (stage === 'progress') {
    return (
      <div className="upl-progress" aria-live="polite">
        <Spinner size={26} />
        <p className="upl-pct">{progress}%</p>
        <div className="prog"><div className="prog-bar" style={{ width: `${progress}%` }} /></div>
        <p className="upl-hint">Processing media… you can keep browsing, we’ll finish in the background. (demo)</p>
      </div>
    )
  }
  const go = () => {
    closeUpload()
    if (submitted?.type === 'video') navigate(`/watch/${submitted.id}`)
    else if (submitted?.type === 'short') navigate(`/shorts/${submitted.id}`)
    else navigate('/')
  }
  return (
    <div className="upl-progress">
      <div className="upl-done"><Icon name="check" size={30} /></div>
      <h4>Your content is live!</h4>
      <p className="upl-hint">Note: uploads use local demo storage — wire `addVideo/addShort/addPost` to your cloud storage later.</p>
      <div className="empty-actions">
        <button type="button" className="btn btn-primary" onClick={go}>View it now</button>
        <button type="button" className="btn btn-soft" onClick={closeUpload}>Done</button>
      </div>
    </div>
  )
}

// ── Video form ─────────────────────────────────────────────────
function VideoForm({ me, onSubmit }) {
  const [file, setFile] = useState(null)
  const [thumb, setThumb] = useState(null)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [cat, setCat] = useState('technology')
  const [tags, setTags] = useState('')
  const [vis, setVis] = useState('public')
  const [errs, setErrs] = useState({})

  const submit = (e) => {
    e.preventDefault()
    const fe = validateFile(file, 'video')
    const te = validateFile(thumb, 'image')
    const next = {
      file: fe, thumb: te,
      title: !title.trim() ? 'A title is required.' : title.trim().length < 3 ? 'Title is too short.' : null,
    }
    setErrs(next)
    if (next.file || next.thumb || next.title) return
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 8)
    onSubmit('video', {
      id: uid('v'), creatorId: me.id, title: title.trim(),
      description: desc.trim() || 'Uploaded with VibeX Studio.',
      src: file ? URL.createObjectURL(file) : SAMPLE_SRc.fun,
      localSrc: !!file,
      poster: thumb ? URL.createObjectURL(thumb) : svgThumb(title.trim(), catById(cat).c1, catById(cat).c2),
      localPoster: !!thumb,
      views: 0, likes: 0, commentCount: 0, category: cat, tags: tagList,
      hashtags: tagList, visibility: vis, createdAt: Date.now(), duration: 0,
    })
  }

  return (
    <form className="upl-form" onSubmit={submit} noValidate>
      <FileDrop icon="upload" label="Select a video file" hint="MP4, WebM or MOV — up to 200 MB"
        accept="video/*" file={file} onPick={setFile} error={errs.file}
        preview={file ? URL.createObjectURL(file) : null} />
      <FileDrop icon="image" label="Thumbnail (optional)" hint="PNG or JPG — 16:9 works best"
        accept="image/*" file={thumb} onPick={setThumb} error={errs.thumb}
        preview={thumb ? URL.createObjectURL(thumb) : null} />
      <Field label="Title" required error={errs.title}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="Give your video a catchy title" />
      </Field>
      <Field label="Description">
        <textarea className="input" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={2000} placeholder="Tell viewers what this is about…" />
      </Field>
      <div className="form-row">
        <Field label="Category">
          <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Tags" hint="Comma separated, up to 8">
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tech, review, 2026" />
        </Field>
      </div>
      <VisibilityPicker value={vis} onChange={setVis} />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary"><Icon name="upload" size={17} /> Publish video</button>
      </div>
    </form>
  )
}

// ── Short form ─────────────────────────────────────────────────
function ShortForm({ me, onSubmit }) {
  const [file, setFile] = useState(null)
  const [caption, setCaption] = useState('')
  const [tags, setTags] = useState('')
  const [music, setMusic] = useState('')
  const [vis, setVis] = useState('public')
  const [errs, setErrs] = useState({})

  const submit = (e) => {
    e.preventDefault()
    const fe = validateFile(file, 'video')
    const ce = !caption.trim() ? 'A caption is required.' : null
    setErrs({ file: fe, caption: ce })
    if (fe || ce) return
    const tagList = tags.split(/[\s,#]+/).map((t) => t.trim()).filter(Boolean).slice(0, 6)
    onSubmit('short', {
      id: uid('s'), creatorId: me.id, caption: caption.trim(),
      music: music.trim() || 'original audio',
      src: file ? URL.createObjectURL(file) : SAMPLE_SRc.blazes,
      localSrc: !!file, poster: svgThumb(caption.trim().slice(0, 24), '#8b5cf6', '#06d6a0', 360, 640),
      views: 0, likes: 0, commentCount: 0, hashtags: tagList, visibility: vis, createdAt: Date.now(),
    })
  }

  return (
    <form className="upl-form" onSubmit={submit} noValidate>
      <FileDrop icon="bolt" label="Select a vertical video" hint="9:16 works best — up to 60s"
        accept="video/*" file={file} onPick={setFile} error={errs.file}
        preview={file ? URL.createObjectURL(file) : null} />
      <Field label="Caption" required error={errs.caption}>
        <input className="input" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={120} placeholder="Say something catchy…" />
      </Field>
      <div className="form-row">
        <Field label="Hashtags" hint="Space separated">
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="#fyp #vibes" />
        </Field>
        <Field label="Music / audio title">
          <input className="input" value={music} onChange={(e) => setMusic(e.target.value)} placeholder="Song — Artist" />
        </Field>
      </div>
      <VisibilityPicker value={vis} onChange={setVis} />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary"><Icon name="bolt" size={17} /> Publish short</button>
      </div>
    </form>
  )
}

// ── Post form ──────────────────────────────────────────────────
function PostForm({ me, onSubmit }) {
  const [mode, setMode] = useState('image') // image | text
  const [files, setFiles] = useState([])
  const [caption, setCaption] = useState('')
  const [vis, setVis] = useState('public')
  const [errs, setErrs] = useState({})
  const ref = useRef(null)

  const pick = (list) => {
    const arr = Array.from(list || [])
    for (const f of arr) {
      const err = validateFile(f, 'image')
      if (err) { setErrs({ files: err }); return }
    }
    setErrs({})
    setFiles((prev) => [...prev, ...arr].slice(0, 5))
  }

  const submit = (e) => {
    e.preventDefault()
    const ce = !caption.trim() ? 'A caption is required.' : null
    const fe = mode === 'image' && files.length === 0 ? 'Add at least one image (or switch to a text post).' : null
    setErrs({ caption: ce, files: fe })
    if (ce || fe) return
    const type = mode === 'text' ? 'text' : files.length > 1 ? 'carousel' : 'image'
    onSubmit('post', {
      id: uid('p'), creatorId: me.id, type,
      media: files.map((f) => URL.createObjectURL(f)), localMedia: true,
      caption: caption.trim(), likes: 0, commentCount: 0,
      hashtags: (caption.match(/#\w+/g) || []).map((h) => h.slice(1)),
      visibility: vis, createdAt: Date.now(),
    })
  }

  return (
    <form className="upl-form" onSubmit={submit} noValidate>
      <div className="seg" role="group" aria-label="Post type">
        <button type="button" className={clsx('seg-item', mode === 'image' && 'active')} onClick={() => setMode('image')}>
          <Icon name="image" size={16} /><span>Image / carousel</span>
        </button>
        <button type="button" className={clsx('seg-item', mode === 'text' && 'active')} onClick={() => setMode('text')}>
          <Icon name="edit" size={16} /><span>Text</span>
        </button>
      </div>

      {mode === 'image' && (
        <div className={clsx('filedrop', errs.files && 'filedrop-err')}>
          {files.length === 0 ? (
            <button type="button" className="filedrop-btn" onClick={() => ref.current?.click()}>
              <span className="fd-icon"><Icon name="images" size={26} /></span>
              <span className="fd-label">Add images</span>
              <span className="fd-hint">Up to 5 · PNG or JPG</span>
            </button>
          ) : (
            <div className="fd-strip">
              {files.map((f, i) => (
                <div key={i} className="fd-thumb">
                  <img src={URL.createObjectURL(f)} alt={`upload ${i + 1}`} />
                  <button type="button" className="fd-thumb-x" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Remove image">
                    <Icon name="x" size={12} />
                  </button>
                </div>
              ))}
              {files.length < 5 && (
                <button type="button" className="fd-thumb fd-add" onClick={() => ref.current?.click()} aria-label="Add another image">
                  <Icon name="plus" size={20} />
                </button>
              )}
            </div>
          )}
          <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => pick(e.target.files)} />
          {errs.files && <span className="field-error" role="alert">{errs.files}</span>}
        </div>
      )}

      <Field label="Caption" required error={errs.caption}>
        <textarea className="input" rows={4} value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500}
          placeholder={mode === 'text' ? 'What’s on your mind?' : 'Say something about these photos… #tags work too'} />
      </Field>
      <VisibilityPicker value={vis} onChange={setVis} />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary"><Icon name="images" size={17} /> Publish post</button>
      </div>
    </form>
  )
}
