import Scene from "../components/Scene.jsx";

export default function Terms() {
  return (
    <>
      <Scene kind="sky" className="banner" banner>
        <div className="banner-inner">
          <h1>Terms and Conditions</h1>
          <p>Please read this before booking a ride with us.</p>
        </div>
      </Scene>

      <section className="section detail-main" style={{ maxWidth: 860, margin: "0 auto" }}>
        <h2 className="section-heading-orange">Bookings</h2>
        <p>
          All bookings are subject to availability and confirmed slot allocation. We recommend booking
          in advance, especially for weekends and peak season dates.
        </p>

        <h2>Weather and safety</h2>
        <p>
          Flights are weather-dependent. If wind, visibility or weather conditions are judged unsafe by
          our instructors, your flight will be rescheduled to the next available slot at no extra cost.
          Safety decisions made on the day by our flying instructors are final.
        </p>

        <h2>Eligibility</h2>
        <p>
          Guests must meet the age, weight and health requirements communicated at the time of booking.
          Please inform our team in advance of any medical conditions that may affect your ability to fly.
        </p>

        <h2>Cancellations and rescheduling</h2>
        <p>
          Cancellations made with sufficient notice may be rescheduled or refunded as per the policy
          communicated at booking. Rescheduling due to weather or safety is offered free of charge.
        </p>

        <h2>Liability</h2>
        <p>
          Adventure sports carry inherent risk. All guests are required to complete a safety briefing and
          follow instructor guidance at all times. By booking a ride, you acknowledge and accept these risks.
        </p>

        <h2>Contact</h2>
        <p>
          For questions about these terms, reach us at{" "}
          <a href="mailto:unityadventuresports1@gmail.com">unityadventuresports1@gmail.com</a> or call{" "}
          <a href="tel:+919081424343">+91 90814 24343</a>.
        </p>
      </section>
    </>
  );
}