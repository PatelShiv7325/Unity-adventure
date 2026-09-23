// TODO (Step 7): fetch /api/reviews/:activityId and render stars + comments
export default function ReviewList({ reviews = [] }) {
  return (
    <div>
      {reviews.map((r) => (
        <p key={r.id}>{"★".repeat(r.rating)} {r.comment}</p>
      ))}
    </div>
  );
}
