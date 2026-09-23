import { useEffect, useState } from "react";
import { getActivities } from "../api/activities";
import ActivityCard from "../components/ActivityCard.jsx";
import Scene from "../components/Scene.jsx";

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    getActivities().then(setActivities).catch(() => setError("Could not load rides. Is the backend running?"));
  }, []);

  return (
    <>
      <Scene kind="winchgliding" className="banner" banner>
        <div className="banner-inner">
          <h1>All rides</h1>
          <p>Pick one, choose your slot, and fly.</p>
        </div>
      </Scene>
      <section className="section">
        {error && <p className="error">{error}</p>}
        <div className="grid">
          {activities.map((a) => <ActivityCard key={a.id} activity={a} />)}
        </div>
      </section>
    </>
  );
}
