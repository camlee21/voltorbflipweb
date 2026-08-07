import { useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from './Footer'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './Layout.css'

export default function Layout({ children }) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="app-root">
      <div className="bg-overlay" />

      <div className="content-wrapper">
        <header className="site-header">

          <h1 className="seo-heading">Voltorb Flip</h1>

          {/* Desktop layout: banner spans both rows, buttons stacked on the right */}
          <div className="header-desktop">

          <div className="site-banner">
            <img src="/sprites/banner_icon.png" alt="" className="site-banner__icon" />
            <div className="site-banner__titles">
              <span className="site-banner__title">VOLTORB FLIP</span>
              <span className="site-banner__subtitle">By Draglash</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
              <a href="https://whosthattrainer.app" target="_blank" rel="noopener noreferrer" title="Who's That Trainer?"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', transition: 'background 0.2s, transform 0.15s', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <img
                  src="wtt-icon.svg"
                  alt="Who's That Trainer?"
                  style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                />
              </a>
              <a href="https://x.com/drag1ash" target="_blank" rel="noopener noreferrer" title="Twitter / X"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', transition: 'background 0.2s, transform 0.15s', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text)">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://ko-fi.com/I8P7210YG4" target="_blank" rel="noopener noreferrer" className="kofi-btn">
                <img src="https://storage.ko-fi.com/cdn/cup-border.png" alt="Ko-fi cup" style={{ height: '18px', width: '18px', objectFit: 'contain', display: 'block' }} />
                <span>Support me on Ko-fi</span>
              </a>
            </div>
          </div>
        </div>

          {/* Mobile layout: single compact row so the board keeps most of the screen */}
          <div className="header-mobile">
            <div className="site-banner site-banner--mobile">
              <img src="/sprites/banner_icon.png" alt="" className="site-banner__icon" />
              <div className="site-banner__titles">
                <span className="site-banner__title">VOLTORB FLIP</span>
                <span className="site-banner__subtitle">By Draglash</span>
              </div>
            </div>

            <div className="header-mobile__actions">
              <a href="https://whosthattrainer.app" target="_blank" rel="noopener noreferrer" title="Who's That Trainer?" className="icon-btn">
                <img src="wtt-icon.svg" alt="Who's That Trainer?" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
              </a>
              <a href="https://x.com/drag1ash" target="_blank" rel="noopener noreferrer" title="Twitter / X" className="icon-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text)">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://ko-fi.com/I8P7210YG4" target="_blank" rel="noopener noreferrer" title="Support me on Ko-fi" className="icon-btn kofi-btn--icon-only">
                <img src="https://storage.ko-fi.com/cdn/cup-border.png" alt="Ko-fi cup" style={{ height: '16px', width: '16px', objectFit: 'contain', display: 'block' }} />
              </a>
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