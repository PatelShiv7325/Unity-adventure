import { Link } from "react-router-dom";
import Scene, { sceneFor } from "./Scene.jsx";
const LEVELS = { Easy: 1, Medium: 2, Hard: 3 };
export function Difficulty({ level }) {
  const n = LEVELS[level] || 1;
  return (
    <span className="peaks" role="img" aria-label={`${level} difficulty`}>
      {[1, 2, 3].map((i) => (
        <svg key={i} viewBox="0 0 16 12" width="16" height="12" className={i <= n ? "on" : ""} aria-hidden="true">
          <path d="M1 11 L8 1 L15 11Z" />
        </svg>
      ))}
      <span className="peaks-label">{level}</span>
    </span>
  );
}
export default function ActivityCard({ activity }) {
  const { kind, photo, photoPosition } = sceneFor(activity.slug, activity.image_url);
  return (
    <article className="card">
      <Link to={`/activities/${activity.slug}`} className="card-media" aria-label={`${activity.title} details`}>
        <Scene kind={kind} photo={photo} photoPosition={photoPosition} />
        <span className="card-time">{activity.duration_minutes} min</span>
      </Link>
      <div className="card-body">
        <h3>{activity.title}</h3>
        <p className="muted">{activity.location}</p>
        <div className="card-foot">
          <p className="price">&#8377;{activity.price}</p>
          <Link className="btn" to={`/book/${activity.slug}`}>Book now</Link>
        </div>
      </div>
    </article>
  );
}