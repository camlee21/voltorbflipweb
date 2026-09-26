import { useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from './Footer'
import PokedollarCounter from './PokedollarCounter'
import AuthModal from './AuthModal'
import { useAuthContext } from '../contexts/useAuthContext'
import { useApplyTheme } from '../utils/useAppliedTheme'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './Layout.css'

function displayName(user) {
  const firstName = user.user_metadata?.full_name?.split(' ')[0]
  return firstName || user.email?.split('@')[0] || 'Trainer'
}

export default function Layout({ children }) {
  const { user, signOut } = useAuthContext()
  const [modalOpen, setModalOpen] = useState(false)

  useApplyTheme()

  const authControls = user ? (
    <div className="auth-user">
      <span className="auth-user-label">{displayName(user)}</span>
      <button type="button" onClick={signOut} className="auth-btn">Sign Out</button>
    </div>
  ) : (
    <button type="button" onClick={() => setModalOpen(true)} className="auth-btn accent">Log In</button>
  )

  return (
    <div className="app-root">
      <div className="bg-overlay" />

      <div className="content-wrapper">
        <header className="site-header">

          <h1 className="seo-heading">Voltorb Flip</h1>

          {/* Desktop layout: banner spans both rows, buttons stacked on the right */}
          <div className="header-desktop">

          <Link to="/" className="site-banner">
            <img src="/sprites/banner_icon.png" alt="" className="site-banner__icon" />
            <div className="site-banner__titles">
              <span className="site-banner__title">VOLTORB FLIP</span>
              <span className="site-banner__subtitle">By Draglash</span>
            </div>
          </Link>

          <div className="header-desktop__side">
            <div className="header-desktop__links">
              <PokedollarCounter />
              <a href="https://whosthattrainer.app" target="_blank" rel="noopener noreferrer" title="Who's That Trainer?" className="social-btn">
                <img src="/wtt-icon.svg" alt="Who's That Trainer?" className="social-btn__img" />
              </a>
              <a href="https://x.com/drag1ash" target="_blank" rel="noopener noreferrer" title="Twitter / X" className="social-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text)" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://ko-fi.com/I8P7210YG4" target="_blank" rel="noopener noreferrer" className="kofi-btn">
                <img src="https://storage.ko-fi.com/cdn/cup-border.png" alt="" className="kofi-btn__cup" />
                <span>Support me on Ko-fi</span>
              </a>
            </div>

            <div className="header-desktop__auth">{authControls}</div>
          </div>
        </div>

          {/* Mobile layout: single compact row so the board keeps most of the screen */}
          <div className="header-mobile">
            <Link to="/" className="site-banner site-banner--mobile">
              <img src="/sprites/banner_icon.png" alt="" className="site-banner__icon" />
              <div className="site-banner__titles">
                <span className="site-banner__title">VOLTORB FLIP</span>
                <span className="site-banner__subtitle">By Draglash</span>
              </div>
            </Link>

            <div className="header-mobile__actions">
              <PokedollarCounter compact />
              <a href="https://x.com/drag1ash" target="_blank" rel="noopener noreferrer" title="Twitter / X" className="icon-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text)" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://ko-fi.com/I8P7210YG4" target="_blank" rel="noopener noreferrer" title="Support me on Ko-fi" className="icon-btn kofi-btn--icon-only">
                <img src="https://storage.ko-fi.com/cdn/cup-border.png" alt="Support me on Ko-fi" className="kofi-btn__cup kofi-btn__cup--small" />
              </a>
            </div>
          </div>
          <div className="mobile-auth-row">{authControls}</div>
        </header>

        {children}

        <Footer />
      </div>

      {modalOpen && <AuthModal onClose={() => setModalOpen(false)} />}

      <Analytics />
      <SpeedInsights />
    </div>
  )
}