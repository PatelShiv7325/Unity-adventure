import { Link } from "react-router-dom";
import Scene from "../../components/Scene.jsx";

export default function Training() {
  return (
    <>
      <Scene kind="paramotor" className="banner" banner>
        <div className="banner-inner">
          <h1>Training</h1>
          <p>Professional paramotor and winchgliding training for those who want to become certified pilots.</p>
        </div>
      </Scene>

      <section className="section">
        <div className="detail">
          <div className="detail-main">
            <h2 className="text-center">Paramotor Training Programs</h2>
            <h2 className="text-center">(foot launch / paratrike)</h2>
                    
            <div className="training-steps-col">
  <div className="training-step">
    <span className="training-step-number">1</span>
    <h3 className="training-step-title">Basic Training</h3>
    <ul>
      <li>Eligibility: Age 18 to 45 years.</li>
      <li>The duration is 7 days, with a maximum limit of 9 days.</li>
      <li>Theory and Ground Handling Practice.</li>
      <li>Introduction to Equipment.</li>
      <li>Safety Measures and Pre-flight Checks.</li>
      <li>Approximately 10 solo flights.</li>
    </ul>
  </div>

  <div className="training-step step-blue">
    <span className="training-step-number">2</span>
    <h3 className="training-step-title">Intermediate Training</h3>
    <ul>
      <li>The duration is 9 days, with a maximum limit of 12 days.</li>
      <li>Advanced Ground Handling Techniques.</li>
      <li>Flight Maneuvers and Control.</li>
      <li>Navigation and Weather Understanding.</li>
      <li>Long-Distance Flights &amp; Solo or Tandem 10 Flights.</li>
    </ul>
  </div>

  <div className="training-step step-orange">
    <span className="training-step-number">3</span>
    <h3 className="training-step-title">Advanced Training</h3>
    <ul>
      <li>The duration is 12 days, with a maximum limit of 15 days.</li>
      <li>Advanced Aerodynamics and Wing Control.</li>
      <li>Cross-Country Flying Techniques.</li>
      <li>Emergency Procedures and Safety Drills.</li>
      <li>Aerobatics Training (Optional).</li>
      <li>Long-Distance Flights & Solo or Tandem 15 Flights.</li>
    </ul>
  </div>
</div>

            <h2 className="section-heading-orange">What's included</h2>
            <ul>
              <li>Comprehensive ground school with theory and safety briefings</li>
              <li>Hands-on training with certified instructors</li>
              <li>Progressive skill development from basics to advanced maneuvers</li>
              <li>Certification preparation and examination support</li>
              <li>Study materials and logbook</li>
            </ul>

            <h2 className="section-heading-orange">Training Schedule</h2>
            <ul>
              <li><strong>Duration:</strong> Courses typically range from 7-15 days depending on level</li>
              <li><strong>Timing:</strong> Morning 6:30 AM-12:00 PM, Evening 4:00 PM-7:00 PM</li>
              <li><strong>Location:</strong> Ralej, Khambhat (Sea/Coastal site)</li>
              <li><strong>Group Size:</strong> Small groups for personalized attention</li>
            </ul>

            <h2 className="section-heading-orange">Prerequisites</h2>
            <ul>
              <li><strong>Age:</strong> Minimum 18 years for certification courses</li>
              <li><strong>Fitness:</strong> Good physical health and ability to run short distances</li>
              <li><strong>Weight:</strong> Between 50-100 kg (equipment dependent)</li>
              <li><strong>Commitment:</strong> Regular attendance and practice between sessions</li>
            </ul>

            <h2 className="section-heading-orange">Good to know</h2>
            <p>
              Training sessions are scheduled based on weather conditions and instructor availability. We prioritize
              safety above all else and will reschedule sessions if conditions are not suitable for training.
              All training is conducted by certified instructors with extensive military and civilian aviation experience.
            </p>
          </div>
          <aside className="detail-side">
  <h3>Start your training</h3>

  <div className="jr-session">
    <h4 className="jr-session-heading jr-session-morning">Morning Session:</h4>
    <p className="jr-session-time">6:30 AM &ndash; 12:00 PM</p>
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
  </div>

  <div className="jr-session">
    <h4 className="jr-session-heading jr-session-site">Instructor</h4>
    <p className="muted">Ex-Indian Army Adventure Flying Instructor</p>
  </div>

  <Link to="/contact" className="btn btn-lg">Contact for training</Link>
</aside>
        </div>
      </section>
    </>
  );
}

