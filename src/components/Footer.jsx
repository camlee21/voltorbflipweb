import { Link } from 'react-router-dom'
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <nav className="site-footer__group" aria-label="Site">
        <Link to="/how-to-play" className="site-footer__link">How to play</Link>
        <Link to="/privacy" className="site-footer__link">Privacy policy</Link>
      </nav>

      <div className="site-footer__group">
        <a href="https://whosthattrainer.app" target="_blank" rel="noopener noreferrer" className="site-footer__link">
          <img src="/wtt-icon.svg" alt="" className="site-footer__icon" />
          Who's That Trainer?
        </a>
        <a href="https://x.com/drag1ash" target="_blank" rel="noopener noreferrer" className="site-footer__link">
          <svg className="site-footer__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          @drag1ash
        </a>
      </div>
    </footer>
  )
}
