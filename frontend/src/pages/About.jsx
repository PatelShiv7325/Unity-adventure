import { Link } from "react-router-dom";
import Scene from "../components/Scene.jsx";
import TrustBand from "../components/TrustBand.jsx";

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
          <h2>Amit Patel &mdash; Founder, Unity Adventure Sports</h2>
<p>
  Amit Patel – Founder, Unity Adventure Sports
With over 15 years of experience in paramotoring and adventure sports, he combines military discipline, professional flying expertise, and a passion for adventure. As a qualified instructor in paramotoring, paragliding, and parasailing, he has trained more than 1,500 Army personnel and adventure enthusiasts. Additionally, he has completed numerous paramotor expeditions (cross-country flying) and competitions, accumulating over 750 hours of paramotor flight experience. He is one of the few individuals in India to have covered a distance of 5,500 kilometers via paramotoring—a feat that demonstrates his immense stamina, experience, and dedication to adventure.
</p>
<p>
  Unity Adventure Sports is not merely an adventure sports company; it is a platform for transformation, skill development, and character building. Through professional training, expeditions, and real-life challenges, we encourage individuals to step out of their comfort zones, overcome fears, and cultivate courage, resilience, discipline, teamwork, leadership, and self-confidence. Our vision is to empower the next generation to realize their potential, face challenges, and evolve into strong, responsible individuals capable of contributing to a robust India.
Empowering youth. Instilling courage. Building a strong nation.
Our mission is to inspire people to transcend boundaries, try new things, experience the freedom of flight, and view the world from a fresh perspective. We aim to make every adventure safe, meaningful, and memorable.
</p>

          <h2>Experience</h2>
          <ul>
            <li>15 years of paramotor, paragliding, parasailing instructor experience</li>
            <li>Approximately 805 hours of flying experience</li>
            <li>5500+ kilometer X-country fluing expeirence</li>
            <li>1500+ studennts are trained</li>
          </ul>
        

    Approximately 650 hours of paramotor flying experience

        </div>
        <aside className="detail-side">
          <h3>Fly with Amit Patel</h3>
          <p className="muted">Every flight is briefed, gear-checked and weather-permitting.</p>
          <Link to="/activities" className="btn btn-lg">Book an adventure</Link>
        </aside>
      </section>

      
       <section className="section">
  <div className="detail-main">
    


  </div>
</section>

<section className="section">
  <div className="detail-main">
    <h2>Operational hours &amp; site</h2>
    <div className="facts-light">
      <div><h3>Morning session</h3><p>6:30 AM &ndash; 12:00 PM &mdash; calm air, clear visibility.</p></div>
      <div><h3>Evening session</h3><p>4:00 PM &ndash; 7:00 PM &mdash; golden-hour flights and sunsets.</p></div>
      <div><h3>Site</h3><p>Ralej, Khambhat &mdash; sea/coastal site near the Arabian Sea coastline.</p></div>
    </div>
  </div>
</section>
    </>
  );
}
