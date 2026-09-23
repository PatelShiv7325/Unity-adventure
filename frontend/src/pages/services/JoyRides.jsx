import { Link } from "react-router-dom";
import Scene from "../../components/Scene.jsx";

export default function JoyRides() {
  return (
    <>
      <Scene kind="winchgliding" className="banner" banner>
        <div className="banner-inner">
          <h1>Joy Rides</h1>
          <p>Short, thrilling flights for first-timers and families &mdash; no experience needed.</p>
        </div>
      </Scene>

      <section className="section">
        <div className="detail">
          <div className="detail-main">
            <div className="jr-title-row">
  <h2>Paramotor Joyride</h2>
  <span className="jr-subtitle">Experience the Freedom of Flight</span>
</div>

<h3 className="jr-heading">What is a Paramotor?</h3>
<p>
  A Paramotor, also known as a Powered Paraglider, combines a lightweight aircraft engine with a
  specially designed paraglider wing, offering one of the most exhilarating yet peaceful flying
  experiences.
</p>
<p>
  Your flight is conducted in tandem with a highly experienced pilot, who takes complete control
  from take-off to landing, allowing you to simply relax and enjoy the breathtaking aerial views.
</p>
<p>
  Unlike enclosed aircraft, a paramotor offers an open-air cockpit with an uninterrupted 360&deg;
  panoramic view, creating a unique sensation of floating effortlessly through the sky. The
  experience is smooth, peaceful, and remarkably close to the freedom of birds in flight.
</p>

<h3 className="jr-heading">Who Can Fly?</h3>
<p>
  No previous flying experience or training is required. Almost anyone can enjoy a tandem
  paramotor flight.
</p>

<p><strong>Eligibility</strong></p>
<ul>
  <li>Minimum weight: 15 kg</li>
  <li>Maximum weight: 100 kg</li>
  <li>No age restriction (minors require guardian consent)</li>
  <li>Anyone who can sit comfortably and follow basic safety instructions is welcome to fly</li>
  <li>Health: Participants should be in good physical condition</li>
  <li>Weather: Flights are weather-dependent and may be rescheduled for safety</li>
</ul>

<h3 className="jr-heading">Our Safety Commitment</h3>
<ul>
  <p>
  At Unity Adventure Sports, safety is our highest priority. Every flight is conducted using
  internationally certified equipment and follows strict operational protocols.
 </p>
 <p>
  Flights are operated only when weather and wind conditions are fully within safe flying limits,
  ensuring a comfortable and enjoyable experience.
 </p>
  <li><strong>Ex-Indian Army Pilots:</strong> Every tandem flight is conducted exclusively by highly experienced Ex-Indian Army pilots with thousands of successful flying hours.</li>
  <li><strong>Certified Equipment:</strong> International-standard paramotor systems, harnesses, helmets, and safety gear are regularly inspected and maintained.</li>
  <li><strong>Dual-Reserve Safety System:</strong> Every paramotor is equipped with an independent reserve parachute for additional safety.</li>
  <li><strong>Real-Time Wind Monitoring:</strong> Digital wind monitoring equipment is used before every launch to ensure safe flying conditions.</li>
  <li><strong>Strict Weight Compliance:</strong> Passengers between 15 kg and 100 kg are accommodated to maintain proper aircraft balance and safety.</li>
</ul>

            <h2>What's included</h2>
            <ul>
              <li>A full safety briefing and gear fitting before takeoff</li>
              <li>A tandem flight with a qualified instructor &mdash; you don't fly alone</li>
              <li>Photos/video of your flight, where available (Additional Charge Applicable).</li>
              <li>Flexible morning and evening slots</li>
            </ul>

            <h2>Good to know</h2>
            <p>
              Joy rides are our most beginner-friendly experience &mdash; ideal if you just want to feel
              the thrill of flying without any training. Flights depend on weather and wind conditions,
              and our team will always put safety first, even if that means rescheduling your slot.
            </p>
          </div>
                    <aside className="detail-side">
            <h3>Book a joy ride</h3>

            <div className="jr-session">
              <h4 className="jr-session-heading jr-session-morning">Morning Session:</h4>
              <p className="jr-session-time">6:30 AM &ndash; 12:00 AM</p>
              <p className="muted">Ideal for calm air conditions, crystal-clear visibility, and stunning morning photography.</p>
            </div>

            <div className="jr-session">
              <h4 className="jr-session-heading jr-session-evening">Evening Session:</h4>
              <p className="jr-session-time">4:00 PM &ndash; 7:00 PM</p>
              <p className="muted">Perfect for golden-hour flights, spectacular sunsets, and cool evening breezes.</p>
            </div>

            <div className="jr-session">
              <h4 className="jr-session-heading jr-session-site">Operational Site</h4>
              <p className="jr-site-name">1. Ralej, Khambhat (Sea / Coastal Site)</p>
            <img
                  src="/images/joyride-site.jpg"
                  alt="Ralej, Khambhat operational site"
                  className="jr-site-photo"
                  />              
              <p className="jr-site-desc">
                Experience an extraordinary combination of heritage, spirituality, and coastal
                beauty while soaring above Ralej.
              </p>
              <ul className="jr-site-desc-list">
                <li>950-Year-Old Shikotar Mata Temple</li>
                <li>
                  Witness the sacred Shikotar Mata Temple, a revered spiritual landmark standing
                  gracefully along the coast for nearly a millennium.
                </li>
                <li>Arabian Sea Coastline</li>
                <li>
                  Enjoy magnificent aerial views of the serene shoreline where the sparkling
                  waters of the Arabian Sea meet the land, creating breathtaking coastal scenery.
                </li>
              </ul>
            </div>

            <Link to="/activities" className="btn btn-lg">See available rides</Link>
          </aside>
        </div>
      </section>
    </>
  );
}