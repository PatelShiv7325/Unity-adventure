import { useEffect, useState } from "react";
import { getActivities } from "../api/activities";
import ActivityCard from "../components/ActivityCard.jsx";
import { CardSkeletons } from "../components/Skeleton.jsx";
import Reveal from "../components/Reveal.jsx";
import Scene from "../components/Scene.jsx";

export default function Activities() {
  const [activities, setActivities] = useState(null);
  const [error, setError] = useState("");
  const load = () => {
    setError("");
    getActivities().then(setActivities).catch(() => setError("Could not load rides. Please check your connection and try again."));
  };
  useEffect(load, []);

  return (
    <>
      <Scene kind="winchgliding" className="banner" banner>
        <div className="banner-inner">
          <h1>All rides</h1>
          <p>Pick one, choose your slot, and fly.</p>
        </div>
      </Scene>
      <section className="section">
        {error && <div className="notice notice-error">{error} <button className="btn btn-small btn-outline" onClick={load}>Retry</button></div>}
        {!activities && !error && <CardSkeletons />}
        {activities && !activities.length && <p className="empty-note">No rides are open for booking right now. Please check back soon.</p>}
        <div className="grid">
          {activities?.map((a, i) => <Reveal key={a.id} delay={i * 0.07}><ActivityCard activity={a} /></Reveal>)}
        </div>
      </section>
    </>
  );
}