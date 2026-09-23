import { Link } from "react-router-dom";
import Scene from "../components/Scene.jsx";
import TrustBand from "../components/TrustBand.jsx";

const EXPEDITIONS = [
  { route: "Rann of Kutch \u2192 Secunderabad", km: "~1,950 km" },
  { route: "Udhampur \u2192 Rukhmukhi", km: "~90 km", note: "2015, Golden Jubilee of the Indo-Pak War of 1965" },
  { route: "Agra \u2192 Nashik", km: "~1,200 km", note: "2015, Golden Jubilee of 17 Para Field Regiment" },
  { route: "Lucknow \u2192 Secunderabad", km: "~1,350 km", note: "AOC 250th Corps Day Paramotor Expedition" },
];

export default function About() {
  return (
    <>
      <Scene kind="paramotor" className="banner banner-tall" banner>
        <div className="banner-inner">
          <h1>Unity Adventure Sports</h1>
          <p>Where adventure meets safety. Every flight becomes a memory.</p>
        </div>
      </Scene>

      <TrustBand />

      <section className="section detail">
        <div className="detail-main">
          <h2>Amit Patel &mdash; Founder</h2>
          <p className="muted">Former Indian Army Adventure Flying Instructor</p>
          <p>
            Amit Patel is an experienced adventure flying professional with extensive experience in
            paramotoring, winchgliding, parasailing and instructional flying. He served with the Army
            Aero Nodal Centre (AANC), AOC Centre, Secunderabad, from 1 April 2018 to 3 May 2022 as a
            Method of Instruction (MOI) Qualified Instructor, and earlier served as a Paramotor Instructor
            at AANC, Agra, from 2012 to 2018. During his service he trained approximately 1,000 officers,
            JCOs and OR of the Indian Army in adventure activities and associated training.
          </p>

          <h2>Experience</h2>
          <ul>
            <li>Approximately 650 hours of paramotor flying experience</li>
            <li>Approximately 150 hours of winchgliding experience</li>
            <li>10 years of paramotor instructor experience</li>
            <li>3 years of winchgliding instructor experience</li>
            <li>4 years of parasailing instructor experience</li>
          </ul>

          <h2>Courses qualified</h2>
          <ul>
            <li>Para Motor Instructor Course</li>
            <li>Winchgliding SIV Course</li>
            <li>Parasailing MOI Course</li>
          </ul>

          <h2>Expeditions</h2>
          <ul className="expeditions">
            {EXPEDITIONS.map((e) => (
              <li key={e.route}>
                <strong>{e.route}</strong>
                <span>{e.km}{e.note ? ` \u00b7 ${e.note}` : ""}</span>
              </li>
            ))}
          </ul>

          <h2>Competitions</h2>
          <p>1st Zorinmawia Inter Services Winchgliding X-Country Competition 2022, Bir Billing, Himachal Pradesh.</p>

          <p className="muted">Certificate reference: Army Aero Nodal Centre (AANC), AOC Centre, C/25803/AANC/2026-27, dated 5 September 2026.</p>
        </div>
        <aside className="detail-side">
          <h3>Fly with Amit Patel</h3>
          <p className="muted">Every flight is briefed, gear-checked and weather-permitting.</p>
          <Link to="/activities" className="btn btn-lg">Book an adventure</Link>
        </aside>
      </section>

      <section className="section">
        <h2>Operational hours &amp; site</h2>
        <div className="facts-light">
          <div><h3>Morning session</h3><p>6:30 AM &ndash; 12:00 PM &mdash; calm air, clear visibility.</p></div>
          <div><h3>Evening session</h3><p>4:00 PM &ndash; 7:00 PM &mdash; golden-hour flights and sunsets.</p></div>
          <div><h3>Site</h3><p>Ralej, Khambhat &mdash; sea/coastal site near the Arabian Sea coastline.</p></div>
        </div>
      </section>
    </>
  );
}
