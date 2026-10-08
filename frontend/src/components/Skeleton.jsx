export function Skeleton({ h = 18, w = "100%", r = 8, style }) {
  return <span className="skeleton" style={{ display: "block", height: h, width: w, borderRadius: r, ...style }} />;
}

export function CardSkeletons({ count = 3 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" aria-hidden="true">
          <Skeleton h={260} r={0} />
          <div className="card-body">
            <Skeleton h={30} w="60%" />
            <Skeleton h={18} w="40%" />
            <Skeleton h={44} w="100%" style={{ marginTop: 18 }} />
          </div>
        </div>
      ))}
    </div>
  );
}