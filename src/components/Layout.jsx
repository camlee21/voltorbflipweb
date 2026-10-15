import { useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from './Footer'
import PokedollarCounter from './PokedollarCounter'
import AuthModal from './AuthModal'
import AccountMenu from './AccountMenu'
import { useAuthContext } from '../contexts/useAuthContext'
import { useApplyTheme } from '../utils/useAppliedTheme'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './Layout.css'

const KOFI_URL = 'https://ko-fi.com/I8P7210YG4'
const KOFI_CUP = 'https://storage.ko-fi.com/cdn/cup-border.png'

export default function Layout({ children }) {
  const { user, signOut } = useAuthContext()
  const [modalOpen, setModalOpen] = useState(false)

  useApplyTheme()

  return (
    <div className="app-root">
      {/* One bar along the top, as on Who's That Trainer: brand on the left, controls on the right.
          Phones give the brand its own row so nothing gets squeezed. */}
      <header className="topbar">
        <h1 className="seo-heading">Voltorb Flip</h1>
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <img src="/sprites/banner_icon.png" alt="" className="brand__icon" />
            <span className="brand__text">
              <span className="brand__title">VOLTORB FLIP</span>
              <span className="brand__byline">by Draglash</span>
            </span>
          </Link>

          <div className="topbar-group topbar-group--coins">
            <PokedollarCounter />
          </div>

          <div className="topbar-group topbar-group--account">
            <a href={KOFI_URL} target="_blank" rel="noopener noreferrer" className="topbar-btn kofi-btn" aria-label="Support me on Ko-fi">
              <img src={KOFI_CUP} alt="" />
              <span className="kofi-label-long">Support me on Ko-fi</span>
              <span className="kofi-label-short" aria-hidden="true">Ko-fi</span>
            </a>
            {user ? (
              <AccountMenu user={user} onSignOut={signOut} />
            ) : (
              <button type="button" onClick={() => setModalOpen(true)} className="topbar-btn topbar-btn--accent">
                Log in
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="content-wrapper">
        {children}

        <Footer />
      </div>

      {modalOpen && <AuthModal onClose={() => setModalOpen(false)} />}

      <Analytics />
      <SpeedInsights />
    </div>
  )
}
