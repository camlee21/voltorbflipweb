
import { Link } from 'react-router-dom'
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-links">
        <Link to="/how-to-play" className="site-footer-link">How to Play</Link>
        <span className="site-footer-divider">•</span>
        <Link to="/privacy" className="site-footer-link">Privacy Policy</Link>
      </div>
    </footer>
  )
}