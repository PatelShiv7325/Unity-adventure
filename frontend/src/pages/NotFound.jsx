import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="section narrow not-found">
      <p className="nf-code">404</p>
      <h1>Off the flight path</h1>
      <p className="muted">The page you are looking for does not exist or has moved.</p>
      <div className="hero-actions" style={{ justifyContent: "center" }}>
        <Link className="btn" to="/">Back to home</Link>
        <Link className="btn btn-outline" to="/activities">See all rides</Link>
      </div>
    </section>
  );
}