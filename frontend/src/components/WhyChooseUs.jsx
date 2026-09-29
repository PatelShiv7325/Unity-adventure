import { useState } from "react";

const POINTS = [
  { color: "navy", icon: "🏅", title: "15+ Years of Excellence", text: "More than two decades of experience in Aero sports training, adventure sports, and aviation excellence." },
  { color: "teal", icon: "🌐", title: "International Standard Training", text: "Professionally designed training programs that follow globally recognized safety and instructional practices." },
  { color: "green", icon: "🎓", title: "Certified & Experienced Instructors", text: "Learn from highly skilled pilots with 15+ years of practical flying and teaching experience." },
  { color: "orange", icon: "🛡️", title: "Safety Comes First", text: "Every flight is conducted with strict safety protocols, certified equipment, and expert supervision." },
  { color: "navy", icon: "⚙️", title: "Premium Flying Equipment", text: "Train using modern, well-maintained equipment and gear that meets international quality standards." },
  { color: "teal", icon: "🤝", title: "Personalized Guidance", text: "Small training groups ensure individual attention and faster skill development." },
  { color: "green", icon: "📈", title: "Progressive Learning Path", text: "From beginner to advanced pilot, every stage is carefully structured to build confidence and competence." },
  { color: "orange", icon: "👥", title: "A Thriving Flying Community", text: "Become part of one of India's most respected Aero sports communities, where learning continues beyond the course." },
  { color: "navy", icon: "📸", title: "Memorable Flying Experiences", text: "Every flight is designed to inspire confidence, create unforgettable memories, and awaken the true spirit of adventure." },
];

const STATS_TOP = [
  { n: "5400+", l: "Kilometers cross country flying experience", c: "gold" },
  { n: "805+", l: "Flying Hrs Experience", c: "orange" },
];
const STATS_BOTTOM = { n: "1500+", l: "Happy Students And Growing!", c: "green" };

const BADGES = ["Safe Training", "Confident Flying", "Unforgettable Experiences"];

const MEMBERSHIPS = [
  { src: "/images/member-appi.png", name: "APPI Power" },
  { src: "/images/member-aero-club.png", name: "Aero Club of India" },
  { src: "/images/member-atoai.png", name: "ATOAI" },
  { src: "/images/member-pai.png", name: "Paragliding Association of India" },
];

function MemberLogo({ src, name }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="member-logo-fallback">{name}</span>;
  return <img className="member-logo" src={src} alt={name} onError={() => setFailed(true)} />;
}

// Drop your own files at these paths (see instructions) - falls back to a
// placeholder card automatically if the file isn't there yet.
const PHOTOS = ["/images/why-us-1.jpg", "/images/why-us-2.jpg", "/images/why-us-3.jpg"];

function Photo({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="why-us-photo why-us-photo-placeholder">
        <span>Add photo:<br />{src.replace("/", "")}</span>
      </div>
    );
  }
  return <img className="why-us-photo" src={src} alt={alt} onError={() => setFailed(true)} />;
}

export default function WhyChooseUs() {
  return (
    <section className="why-us">
      <div className="section why-us-inner">
        <div className="why-us-top">
          <div className="why-us-heading">
            <span className="why-us-eyebrow">Why Choose</span>
            <h2 className="why-us-title">
              <span className="why-us-unity">UNITY</span>{" "}
              <span className="why-us-adventure">ADVENTURE</span>{" "}
              <span className="why-us-unity">SPORTS?</span>
            </h2>
            <span className="why-us-tagline">Learn. Fly. Grow. Repeat.</span>
          </div>

          <div className="why-us-splash">
            <div className="why-us-splash-top">
              {STATS_TOP.map((s, i) => (
                <div key={s.l} className="why-us-stat">
                  <strong className={`why-us-stat-n why-us-stat-${s.c}`}>{s.n}</strong>
                  <span>{s.l}</span>
                  {i === 0 && <span className="why-us-splash-divider-v" />}
                </div>
              ))}
            </div>
            <span className="why-us-splash-divider-h" />
            <div className="why-us-splash-bottom">
              <strong className={`why-us-stat-n why-us-stat-${STATS_BOTTOM.c}`}>{STATS_BOTTOM.n}</strong>
              <span>{STATS_BOTTOM.l}</span>
            </div>
          </div>
        </div>

        <div className="why-us-columns">
          <div className="why-us-list">
            {POINTS.map((p) => (
              <div key={p.title} className="why-us-card">
                <div className={`why-us-icon why-us-icon-${p.color}`}>{p.icon}</div>
                <div>
                  <h3 className={`why-us-card-title why-us-title-${p.color}`}>{p.title}</h3>
                  <p className="muted">{p.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="why-us-photos">
            {PHOTOS.map((src) => <Photo key={src} src={src} alt="Unity Adventure Sports" />)}
          </div>
        </div>
      </div>

      {/* Memberships + Foundation of Excellence */}
      <div className="section foundation">
        <div className="member-heading">
          <span className="why-us-eyebrow">Proud Member Of</span>
          <span className="member-heading-line" />
        </div>

        <div className="member-logos">
          {MEMBERSHIPS.map((m) => (
            <div key={m.name} className="member-tile">
              <MemberLogo src={m.src} name={m.name} />
            </div>
          ))}
        </div>

        <div className="foundation-card">
          <p className="foundation-text">
            <strong>Amit Patel</strong> continuously strives to enhance his knowledge and expertise by
            participating in nationally recognized training programs and certification courses. His
            commitment to professional excellence is reflected in his pursuit of globally respected
            qualifications offered by organizations such as <strong>APPI</strong> (Association of
            Paramotor &amp; Paratrike Pilots and Instructors), <strong>Aero Club of India</strong>,{" "}
            <strong>PAI</strong> (Paragliding Association of India) and other leading aviation and
            adventure sports institutions. This dedication ensures that his training philosophy aligns
            with international safety standards, modern teaching practices, highest levels of
            professionalism, providing every student with a world-class learning experience.
          </p>
        </div>

        <div className="foundation-panel">
          <h3 className="foundation-title">The Foundation of Excellence</h3>
          <p className="foundation-sub">
            Unity Adventure Sports is not just a professional Ride and training center; it is a legacy
            established on the principles of military discipline and unwavering safety protocols. Amit
            Patel's vision has nurtured hundreds of pilots, fostering a culture of teamwork and
            self-confidence.
          </p>
        </div>
      </div>

      <div className="why-us-banner">
        {BADGES.map((b) => (
          <span key={b} className="why-us-banner-item">✔ {b.toUpperCase()}</span>
        ))}
      </div>
    </section>
  );
}