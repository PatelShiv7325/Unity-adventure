import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [servicesOpen, setServicesOpen] = useState(false);

  return (
    <header className="site-header">
      {/* Logo panel: small icon left, full wordmark logo centered */}
      <div className="logo-bar">
        <Link to="/" className="brand-icon">
          <img src="/images/logo-icon-small.png" alt="Unity Adventure Sports" />
        </Link>
        <Link to="/" className="brand-logo">
          <img src="/images/logo-wordmark.png" alt="Unity Adventure Sports" />
        </Link>
      </div>

      {/* Options bar */}
      <div className="nav-bar">
        <div className="nav-bar-inner">
          <span className="nav-spacer" aria-hidden="true" />
          <nav className="nav-links">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/vision">Vision</NavLink>

            <div
              className="nav-dropdown"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <button
                type="button"
                className="nav-dropdown-trigger"
                onClick={() => setServicesOpen((v) => !v)}
                aria-expanded={servicesOpen}
              >
                Our Services <span className="caret">▾</span>
              </button>
              {servicesOpen && (
                <div className="dropdown-menu">
                  <NavLink to="/services/joy-rides" onClick={() => setServicesOpen(false)}>Joy Rides</NavLink>
                  <NavLink to="/services/training" onClick={() => setServicesOpen(false)}>Training</NavLink>
                </div>
              )}
            </div>

            <NavLink to="/contact">Contact</NavLink>
            <NavLink to="/terms">Terms and Conditions</NavLink>
            {user && user.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
            {user && <NavLink to="/dashboard">My bookings</NavLink>}
          </nav>
          <div className="nav-auth">
            {user ? (
              <button className="link-btn" onClick={() => { logout(); navigate("/"); }}>Log out</button>
            ) : (
              <Link to="/login" className="btn btn-small">Log in</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}