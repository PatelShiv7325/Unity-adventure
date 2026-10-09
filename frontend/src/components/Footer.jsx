import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <svg className="footer-ridge" viewBox="0 0 1200 80" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 80 L0 50 L120 20 L220 48 L340 10 L470 52 L590 26 L720 56 L850 14 L980 50 L1100 24 L1200 46 L1200 80Z" fill="#0b1b2b" />
      </svg>
      <div className="footer-body footer-cols">
        <div>
          <strong className="footer-brand">Unity Adventure Sports</strong>
          <p>Paramotor, winchgliding and parasailing rides with an ex-Indian Army flying instructor.</p>
        </div>
        <nav className="footer-links footer-col" aria-label="Footer">
          <strong>Explore</strong>
          <Link to="/activities">Rides</Link>
          <Link to="/gallery">Gallery</Link>
          <Link to="/about">About</Link>
          <Link to="/terms">Terms &amp; conditions</Link>
        </nav>
        <div className="footer-col">
          <strong>Contact</strong>
          <a href="tel:+919081424343">+91 90814 24343</a>
          <a href="mailto:unityadventuresports1@gmail.com">unityadventuresports1@gmail.com</a>
          <a href="https://instagram.com/unityadventuresports" target="_blank" rel="noreferrer">@unityadventuresports</a>
        </div>
        <div className="footer-col">
          <strong>Flying site</strong>
          <span>Ralej, Khambhat (coastal)</span>
          <span>Morning 6:30 AM &ndash; 12:00 PM</span>
          <span>Evening 4:00 PM &ndash; 7:00 PM</span>
        </div>
      </div>
      <div className="footer-base"><small>&copy; {new Date().getFullYear()} Unity Adventure Sports. All rights reserved.</small></div>
    </footer>
  );
}