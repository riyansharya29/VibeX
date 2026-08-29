import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { BRAND } from './config/brand'
import { useStore } from './store/useStore'
import { TopBar, Sidebar, BottomNav } from './components/chrome'
import { CreateSheet, UploadModal } from './components/create'
import ShareSheet from './components/ShareSheet'
import { ToastHost, PageLoader } from './components/ui'
import ErrorBoundary from './components/ErrorBoundary'

// Route-level code splitting → faster first paint on mobile
const Home = lazy(() => import('./pages/Home'))
const Shorts = lazy(() => import('./pages/Shorts'))
const Watch = lazy(() => import('./pages/Watch'))
const Explore = lazy(() => import('./pages/Explore'))
const Search = lazy(() => import('./pages/Search'))
const Profile = lazy(() => import('./pages/Profile'))
const Following = lazy(() => import('./pages/Following'))
const Messages = lazy(() => import('./pages/Messages'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Settings = lazy(() => import('./pages/Settings'))
const Admin = lazy(() => import('./pages/Admin'))
const Auth = lazy(() => import('./pages/Auth'))
const NotFound = lazy(() => import('./pages/NotFound'))
const { Library, History, Saved } = {
  Library: lazy(() => import('./pages/collections').then((m) => ({ default: m.Library }))),
  History: lazy(() => import('./pages/collections').then((m) => ({ default: m.History }))),
  Saved: lazy(() => import('./pages/collections').then((m) => ({ default: m.Saved }))),
}

/** Applies brand palette from src/config/brand.js as CSS variables (rebrand hook). */
function useBrandVars() {
  useEffect(() => {
    const r = document.documentElement
    r.style.setProperty('--accent-a', BRAND.colors.accentA)
    r.style.setProperty('--accent-b', BRAND.colors.accentB)
    r.style.setProperty('--accent-c', BRAND.colors.accentC)
    document.title = BRAND.name
  }, [])
}

/** Theme: light / dark / system (listens to OS changes). */
function useTheme() {
  const theme = useStore((s) => s.theme)
  useEffect(() => {
    const apply = () => {
      const resolved =
        theme === 'system'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : theme
      document.documentElement.dataset.theme = resolved
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0b0b10' : '#f6f6f9')
    }
    apply()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // scrollTo with options is missing in some embedded webviews — never let it crash the app
    try { document.querySelector('.main')?.scrollTo?.({ top: 0 }) } catch { /* noop */ }
    try { window.scrollTo?.({ top: 0 }) } catch { /* noop */ }
  }, [pathname])
  return null
}

export default function App() {
  useBrandVars()
  useTheme()
  const location = useLocation()
  const bare = location.pathname.startsWith('/auth') // auth renders full-screen, no chrome
  const isShorts = location.pathname.startsWith('/shorts')

  if (bare) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes><Route path="/auth" element={<Auth />} /></Routes>
        </Suspense>
        <ToastHost />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className={`app-shell ${isShorts ? 'shell-shorts' : ''}`}>
        <TopBar />
        <div className="app-body">
          <Sidebar />
          <main className="main" id="main">
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shorts" element={<Shorts />} />
                <Route path="/shorts/:id" element={<Shorts />} />
                <Route path="/watch/:id" element={<Watch />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/search" element={<Search />} />
                <Route path="/profile/:username?" element={<Profile />} />
                <Route path="/following" element={<Following />} />
                <Route path="/library" element={<Library />} />
                <Route path="/history" element={<History />} />
                <Route path="/saved" element={<Saved />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/messages/:convId" element={<Messages />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
        </div>
        <BottomNav />
      </div>

      {/* Global overlays */}
      <CreateSheet />
      <UploadModal />
      <ShareSheet />
      <ToastHost />
    </ErrorBoundary>
  )
}
