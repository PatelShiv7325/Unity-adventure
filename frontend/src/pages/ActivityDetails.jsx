import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getActivity } from "../api/activities";
import { Difficulty } from "../components/ActivityCard.jsx";
import Scene, { sceneFor } from "../components/Scene.jsx";

export default function ActivityDetails() {
  const { slug } = useParams();
  const [a, setA] = useState(null);
  useEffect(() => { getActivity(slug).then(setA).catch(() => {}); }, [slug]);
  if (!a) return <section className="section"><p>Loading...</p></section>;

  const { kind, photo } = sceneFor(a.slug, a.image_url);
  return (
    <>
      <Scene kind={kind} photo={photo} className="banner banner-tall" banner>
        <div className="banner-inner">
          <h1>{a.title}</h1>
          <p>{a.location} &middot; {a.duration_minutes} min</p>
        </div>
      </Scene>
      <section className="section detail">
        <div className="detail-main">
          <h2>About this ride</h2>
          <p>{a.description}</p>
          <h2>Safety</h2>
          <p>{a.safety_notes}</p>
          {/* TODO: photo gallery, FAQs, Google Map, live weather, reviews */}
        </div>
        <aside className="detail-side">
          <p className="price"><small>from</small> &#8377;{a.price}</p>
          <p className="muted">per person</p>
          <Difficulty level={a.difficulty} />
          <p className="muted">{a.duration_minutes} minutes in the air or on the trail</p>
          <Link to={`/book/${a.slug}`} className="btn btn-lg">Book now</Link>
        </aside>
      </section>
    </>
  );
}
