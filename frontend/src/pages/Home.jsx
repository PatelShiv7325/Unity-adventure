import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getActivities } from "../api/activities";
import ActivityCard from "../components/ActivityCard.jsx";
import Scene from "../components/Scene.jsx";
import TrustBand from "../components/TrustBand.jsx";
import WhyChooseUs from "../components/WhyChooseUs.jsx";

export default function Home() {
  const [activities, setActivities] = useState([]);
  useEffect(() => { getActivities().then(setActivities).catch(() => {}); }, []);

  return (
    <>
      <section className="hero hero-video">
  <video
  className="hero-video-bg"
  src="/videos/hero.mp4"
  autoPlay
  muted
  loop
  playsInline
/>
  <div className="hero-video-shade" aria-hidden="true" />
  <div className="hero-inner">
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
      <h1>Experience the sky like never before.</h1>
      <div className="hero-actions">
        <Link className="btn btn-lg" to="/activities">See all rides</Link>
        <Link className="btn btn-ghost btn-lg" to="/about">Meet your instructor</Link>
      </div>
    </motion.div>
  </div>
</section>

      <TrustBand />

      <section className="rides-section">
        <Scene kind="mountains" className="rides-bg" />
        <div className="section rides-content">
          <h2>Choose your ride</h2>
          <div className="grid">
            {activities.map((a) => <ActivityCard key={a.id} activity={a} />)}
          </div>
        </div>
      </section>
 
      <WhyChooseUs />

      <section className="section">
        <h2>From the ground to the sky in three steps</h2>
        <ol className="steps">
          <li><h3>Pick a ride</h3><p>Paramotor, winchgliding or parasailing. Check the price and difficulty first.</p></li>
          <li><h3>Choose a slot</h3><p>Select a date and time, then tell us who is flying.</p></li>
          <li><h3>Pay and show your ticket</h3><p>Pay online, then arrive at the launch point with your ticket code.</p></li>
        </ol>
      </section>

      <Scene kind="paramotor" className="band" banner>
        <div className="band-inner">
          <h2>Safety comes before the schedule</h2>
          <div className="facts">
            <div><h3>Briefing first</h3><p>Every flyer gets a safety briefing before the ride.</p></div>
            <div><h3>Checked gear</h3><p>Equipment is inspected before it is used.</p></div>
            <div><h3>Weather decides</h3><p>If the wind is wrong, we move your slot instead of flying.</p></div>
          </div>
        </div>
      </Scene>
    </>
  );
}