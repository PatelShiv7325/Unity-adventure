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
  { n: "5400+", l: "Adventure Courses", c: "gold" },
  { n: "700+", l: "Expert Instructors", c: "orange" },
];
const STATS_BOTTOM = { n: "1500+", l: "Happy Students And Growing!", c: "green" };

const BADGES = ["Safe Training", "Confident Flying", "Unforgettable Experiences"];

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
            {PHOTOS.map((src, i) => <Photo key={src} src={src} alt="Unity Adventure Sports" />)}
          </div>
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