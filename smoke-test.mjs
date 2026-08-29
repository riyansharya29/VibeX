// Headless smoke test: mounts the compiled production bundle in jsdom and
// reports any runtime crash + what actually rendered into #root.
import { JSDOM } from 'jsdom'
import { readFileSync } from 'fs'
import { pathToFileURL } from 'url'
import { resolve } from 'path'

const htmlSrc = readFileSync('dist/index.html', 'utf8')
const entry = htmlSrc.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1]
if (!entry) throw new Error('entry bundle not found in dist/index.html')
const bundle = 'dist' + entry
console.log('bundle:', bundle)

const route = process.env.SMOKE_ROUTE || '/'
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:4173' + route,
  pretendToBeVisual: true,
})

const w = dom.window

// Stub browser APIs jsdom lacks
w.matchMedia = w.matchMedia || ((q) => ({
  matches: false, media: q, addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
}))
w.IntersectionObserver = class {
  constructor(cb) { this.cb = cb }
  observe() {} unobserve() {} disconnect() {}
}
w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
w.scrollTo = () => {}
// Browser-realistic polyfills jsdom lacks (present in all modern browsers)
w.Element.prototype.scrollTo = w.Element.prototype.scrollTo || function () {}
w.HTMLElement.prototype.scrollIntoView = w.HTMLElement.prototype.scrollIntoView || function () {}
if (!w.URL.createObjectURL) w.URL.createObjectURL = () => 'blob:mock'
global.window = w
for (const k of ['document', 'navigator', 'localStorage', 'location', 'MutationObserver',
  'CustomEvent', 'Event', 'KeyboardEvent', 'MouseEvent', 'HTMLMediaElement',
  'getComputedStyle', 'DOMRect', 'Node', 'Element', 'HTMLElement', 'SVGElement',
  'DocumentFragment', 'CSS', 'FileReader', 'Blob', 'URL', 'Image', 'self',
  'IntersectionObserver', 'ResizeObserver']) {
  global[k] = global[k] ?? w[k]
}
global.self = global.self || w
global.requestAnimationFrame = (cb) => setTimeout(cb, 0)
global.cancelAnimationFrame = clearTimeout

w.addEventListener('error', (e) => console.error('WINDOW ERROR:', e.message))

try {
  await import(pathToFileURL(resolve(bundle)).href)
  await new Promise((r) => setTimeout(r, 1500))

  const root = w.document.getElementById('root')
  const html = root.innerHTML || ''
  console.log(`route ${route} → root children: ${root.children.length}, innerHTML length: ${html.length}`)

  if (html.length < 50) {
    console.error('❌ RENDERED ALMOST NOTHING — runtime failure')
    process.exit(1)
  }
  const errorBox = html.match(/Something broke[^<]*/)?.[0]
  if (errorBox) {
    console.error('❌ ErrorBoundary triggered:', errorBox)
    const msg = html.match(/<p>([^<]{5,200})<\/p>/)?.[1]
    console.error('   detail:', msg)
    process.exit(1)
  }
  for (const probe of ['Home', 'Shorts', 'Explore', 'VibeX', 'Trending', 'chip']) {
    if (html.includes(probe)) console.log('  ✓ found:', probe)
  }
  console.log('✅ app mounted with real content')
} catch (e) {
  console.error('❌ CRASH:', e.message)
  console.error(e.stack?.split('\n').slice(0, 6).join('\n'))
  process.exit(1)
}
