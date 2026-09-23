import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <svg className="footer-ridge" viewBox="0 0 1200 80" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 80 L0 50 L120 20 L220 48 L340 10 L470 52 L590 26 L720 56 L850 14 L980 50 L1100 24 L1200 46 L1200 80Z" fill="#0b1b2b" />
      </svg>
      <div className="footer-body">
        <div>
          <strong className="footer-brand">Unity Adventure Sports</strong>
          <p>Paramotor, winchgliding and parasailing rides.</p>
        </div>
        <nav className="footer-links">
          <Link to="/activities">Rides</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <small>&copy; {new Date().getFullYear()} Unity Adventure Sports</small>
      </div>
    </footer>
  );
}
