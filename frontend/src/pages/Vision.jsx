import { Link } from "react-router-dom";
import Scene from "../components/Scene.jsx";

export default function Vision() {
  return (
    <>
      <Scene kind="mountains" className="banner" banner>
        <div className="banner-inner">
          <h1>Our Vision</h1>
          <p>Making the sky accessible, safe and unforgettable for everyone.</p>
        </div>
      </Scene>

      <section className="section detail">
        <div className="detail-main">
          <h2>Why we fly</h2>
          <p>
            Unity Adventure Sports was built on a simple belief: everyone deserves to feel what it's like
            to leave the ground. From first-time flyers to seasoned thrill-seekers, we design every
            experience around two things &mdash; safety and wonder.
          </p>

          <h2>What guides us</h2>
          <ul>
            <li>Safety-first flying, briefed and gear-checked before every launch</li>
            <li>Instruction led by qualified, military-trained flying professionals</li>
            <li>Honest pricing and clear communication, from booking to landing</li>
            <li>Respect for the coastline, the weather, and the communities we fly over</li>
          </ul>

          <h2>Where we're headed</h2>
          <p>
            We're growing our fleet of experiences and training more certified instructors so more people
            along the coast can safely experience winchgliding, paramotoring and parasailing &mdash; without
            compromising on the standards that keep every flight safe.
          </p>
        </div>
        <aside className="detail-side">
          <h3>Ready to fly with us?</h3>
          <p className="muted">See every ride we offer and pick your slot.</p>
          <Link to="/activities" className="btn btn-lg">Explore rides</Link>
        </aside>
      </section>
    </>
  );
}