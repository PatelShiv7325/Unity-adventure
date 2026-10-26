import { useEffect, useState } from "react";
import { getActivities, readCachedActivities } from "../api/activities";
import ActivityCard from "../components/ActivityCard.jsx";
import { CardSkeletons } from "../components/Skeleton.jsx";
import Reveal from "../components/Reveal.jsx";
import Scene from "../components/Scene.jsx";

export default function Activities() {
  // start with the rides saved from the last visit (if any) so the page is never empty
  const [activities, setActivities] = useState(() => readCachedActivities());
  const [error, setError] = useState("");
  const [slow, setSlow] = useState(false);

  const load = () => {
    setError("");
    setSlow(false);
    getActivities()
      .then(setActivities)
      .catch(() => {
        // if we already show saved rides, keep them instead of an error
        setActivities((current) => {
          if (!current) setError("Could not load rides. Please check your connection and try again.");
          return current;
        });
      });
  };
  useEffect(load, []);

  // after 4 seconds of waiting, tell the visitor the server is starting up
  useEffect(() => {
    if (activities) return undefined;
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, [activities]);

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
        {!activities && !error && slow && <p className="empty-note">Getting the rides ready - the server is starting up, this can take up to a minute the first time.</p>}
        {!activities && !error && <CardSkeletons />}
        {activities && !activities.length && <p className="empty-note">No rides are open for booking right now. Please check back soon.</p>}
        <div className="grid">
          {activities?.map((a, i) => <Reveal key={a.id} delay={i * 0.07}><ActivityCard activity={a} /></Reveal>)}
        </div>
      </section>
    </>
  );
}