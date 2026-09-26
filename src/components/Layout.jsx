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

const KOFI_URL = 'https://ko-fi.com/I8P7210YG4'
const KOFI_CUP = 'https://storage.ko-fi.com/cdn/cup-border.png'

function displayName(user) {
  const firstName = user.user_metadata?.full_name?.split(' ')[0]
  return firstName || user.email?.split('@')[0] || 'Trainer'
}

export default function Layout({ children }) {
  const { user, signOut } = useAuthContext()
  const [modalOpen, setModalOpen] = useState(false)

  useApplyTheme()

  return (
    <div className="app-root">
      <div className="content-wrapper">
        <header className="site-header">
          <h1 className="seo-heading">Voltorb Flip</h1>

          <Link to="/" className="brand">
            <img src="/sprites/banner_icon.png" alt="" className="brand__icon" />
            <span className="brand__text">
              <span className="brand__title">VOLTORB FLIP</span>
              <span className="brand__byline">by Draglash</span>
            </span>
          </Link>

          <div className="header-actions">
            <div className="header-actions__row">
              <PokedollarCounter />
              <a
                href={KOFI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="kofi-btn"
                aria-label="Support me on Ko-fi"
              >
                <img src={KOFI_CUP} alt="" className="kofi-btn__cup" />
                <span className="kofi-btn__label">Support me on Ko-fi</span>
              </a>
            </div>
            <div className="header-actions__row header-actions__row--auth">
              {user ? (
                <div className="auth-user">
                  <span className="auth-user__name">{displayName(user)}</span>
                  <button type="button" onClick={signOut} className="header-btn">Sign out</button>
                </div>
              ) : (
                <button type="button" onClick={() => setModalOpen(true)} className="header-btn header-btn--accent">
                  Log in
                </button>
              )}
            </div>
          </div>
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
